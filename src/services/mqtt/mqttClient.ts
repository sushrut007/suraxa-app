import mqtt, { MqttClient } from 'mqtt';
import {
  parseStatePayload,
  parseStatusPayload,
  parseTelemetryPayload,
  parseTopic,
} from './payloadParser';
import {
  CommandPayload,
  MqttClientOptions,
  MqttConnectionState,
  StatePayload,
  StatusPayload,
  TelemetryPayload,
} from './types';

export type MessageHandler = (
  deviceId: string,
  channel: 'telemetry' | 'state' | 'status',
  payload: TelemetryPayload | StatePayload | StatusPayload
) => void;

export type ConnectionStateListener = (state: MqttConnectionState) => void;

export class SuraxaMqttClient {
  private client: MqttClient | null = null;
  private connectionState: MqttConnectionState = 'offline';
  private connectionListeners: Set<ConnectionStateListener> = new Set();
  private messageHandlers: Set<MessageHandler> = new Set();
  private subscribedTopics: Set<string> = new Set();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000; // 1s initial
  private readonly maxReconnectDelay = 30000; // 30s max exponential backoff
  private isExplicitDisconnect = false;

  private options: MqttClientOptions;

  constructor(options?: Partial<MqttClientOptions>) {
    this.options = {
      brokerUrl:
        options?.brokerUrl ||
        process.env.EXPO_PUBLIC_MQTT_BROKER_URL ||
        'wss://f0e181ba.ala.asia-southeast1.emqxsl.com:8084/mqtt',
      username: options?.username || process.env.EXPO_PUBLIC_MQTT_USERNAME || 'suraxa_app',
      password: options?.password || process.env.EXPO_PUBLIC_MQTT_PASSWORD || 'suraxa_app@123',
      clientIdPrefix:
        options?.clientIdPrefix || process.env.EXPO_PUBLIC_MQTT_CLIENT_PREFIX || 'suraxa_app_',
      keepalive: options?.keepalive ?? 30, // 30s keepalive
      connectTimeout: options?.connectTimeout ?? 10000,
    };
  }

  public getConnectionState(): MqttConnectionState {
    return this.connectionState;
  }

  public onConnectionStateChange(listener: ConnectionStateListener): () => void {
    this.connectionListeners.add(listener);
    listener(this.connectionState);
    return () => this.connectionListeners.delete(listener);
  }

  public onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  private setConnectionState(newState: MqttConnectionState) {
    if (this.connectionState === newState) return;
    this.connectionState = newState;
    this.connectionListeners.forEach((listener) => {
      try {
        listener(newState);
      } catch (err) {
        console.warn('[MQTT] Error in connection listener:', err);
      }
    });
  }

  public connect(): void {
    if (this.client && (this.client.connected || this.client.reconnecting)) {
      return;
    }

    this.isExplicitDisconnect = false;
    this.setConnectionState('connecting');

    const clientId = `${this.options.clientIdPrefix || 'suraxa_app_'}${Math.random().toString(16).substring(2, 10)}`;

    try {
      this.client = mqtt.connect(this.options.brokerUrl, {
        clientId,
        username: this.options.username,
        password: this.options.password,
        keepalive: this.options.keepalive,
        clean: true,
        connectTimeout: this.options.connectTimeout,
        reconnectPeriod: 0, // We handle exponential backoff manually for strict 1s-30s contract
      });

      this.client.on('connect', () => {
        this.reconnectDelay = 1000; // Reset backoff on successful connection
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
        this.setConnectionState('connected');

        // Resubscribe to all active topics on reconnect!
        if (this.subscribedTopics.size > 0) {
          const topics = Array.from(this.subscribedTopics);
          this.client?.subscribe(topics, { qos: 1 }, (err) => {
            if (err) {
              console.warn('[MQTT] Resubscribe error on reconnect:', err);
            }
          });
        }
      });

      this.client.on('message', (topic: string, message: Buffer) => {
        this.handleIncomingMessage(topic, message);
      });

      this.client.on('close', () => {
        if (!this.isExplicitDisconnect) {
          this.scheduleReconnect();
        } else {
          this.setConnectionState('offline');
        }
      });

      this.client.on('error', (err) => {
        console.warn('[MQTT] Client error:', err.message);
        if (!this.client?.connected && !this.isExplicitDisconnect) {
          this.scheduleReconnect();
        }
      });
    } catch (err) {
      console.warn('[MQTT] Connection initialization failed:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.isExplicitDisconnect) return;
    if (this.reconnectTimeout) return;

    this.setConnectionState('reconnecting');

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      // Exponential backoff with 30s cap
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      this.connect();
    }, this.reconnectDelay);
  }

  private handleIncomingMessage(topic: string, message: Buffer): void {
    const parsedTopic = parseTopic(topic);
    if (!parsedTopic) return;

    const { deviceId, channel } = parsedTopic;
    const raw = message.toString();

    if (channel === 'telemetry') {
      const telemetry = parseTelemetryPayload(raw);
      if (telemetry) {
        this.emitMessage(deviceId, 'telemetry', telemetry);
      }
    } else if (channel === 'state') {
      const state = parseStatePayload(raw);
      if (state) {
        this.emitMessage(deviceId, 'state', state);
      }
    } else if (channel === 'status') {
      const status = parseStatusPayload(raw);
      if (status) {
        this.emitMessage(deviceId, 'status', status);
      }
    }
  }

  private emitMessage(
    deviceId: string,
    channel: 'telemetry' | 'state' | 'status',
    payload: TelemetryPayload | StatePayload | StatusPayload
  ): void {
    this.messageHandlers.forEach((handler) => {
      try {
        handler(deviceId, channel, payload);
      } catch (err) {
        console.warn('[MQTT] Error in message handler:', err);
      }
    });
  }

  /**
   * Subscribes to telemetry, state, and status topics for a given device.
   */
  public subscribeDevice(deviceId: string): void {
    const topics = [
      `suraxa/${deviceId}/telemetry`,
      `suraxa/${deviceId}/state`,
      `suraxa/${deviceId}/status`,
    ];

    topics.forEach((t) => this.subscribedTopics.add(t));

    if (this.client?.connected) {
      this.client.subscribe(topics, { qos: 1 }, (err) => {
        if (err) {
          console.warn(`[MQTT] Failed to subscribe to topics for ${deviceId}:`, err);
        }
      });
    }
  }

  /**
   * Unsubscribes from topics for a given device.
   */
  public unsubscribeDevice(deviceId: string): void {
    const topics = [
      `suraxa/${deviceId}/telemetry`,
      `suraxa/${deviceId}/state`,
      `suraxa/${deviceId}/status`,
    ];

    topics.forEach((t) => this.subscribedTopics.delete(t));

    if (this.client?.connected) {
      this.client.unsubscribe(topics);
    }
  }

  /**
   * Publishes a command (relay or led) to suraxa/<deviceId>/cmd.
   */
  public publishCommand(deviceId: string, cmd: CommandPayload): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.client.connected) {
        return reject(new Error('MQTT client is not connected'));
      }

      const topic = `suraxa/${deviceId}/cmd`;
      const payload = JSON.stringify(cmd);

      this.client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  public disconnect(): void {
    this.isExplicitDisconnect = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.client) {
      this.client.end(true);
      this.client = null;
    }
    this.setConnectionState('offline');
  }
}

// Global singleton client instance
export const mqttClient = new SuraxaMqttClient();
