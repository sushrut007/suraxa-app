import { useDeviceStore } from '../../store';
import { throttle, ThrottledFunction } from '../../utils/throttle';
import { SuraxaMqttClient, mqttClient as defaultClient } from './mqttClient';
import { LedCommand, RelayCommand } from './types';

export const CONFIRMATION_TIMEOUT_MS = 5000; // 5 seconds
export const LED_COMMAND_THROTTLE_MS = 150; // 150 ms per CLAUDE.md

interface PendingRelayRequest {
  relayIndex: number;
  targetValue: 0 | 1;
  timer: ReturnType<typeof setTimeout>;
  resolve: () => void;
  reject: (err: Error) => void;
}

export class CommandManager {
  private client: SuraxaMqttClient;
  private pendingRelays: Map<string, Map<number, PendingRelayRequest>> = new Map();
  private throttledLedPublishers: Map<string, ThrottledFunction<(...args: unknown[]) => void>> =
    new Map();

  constructor(client: SuraxaMqttClient = defaultClient) {
    this.client = client;

    // Listen to MQTT messages to detect state confirmations
    this.client.onMessage((deviceId, channel, payload) => {
      if (channel === 'state') {
        this.handleStateConfirmation(deviceId, payload as { relays: number[] });
      }
    });
  }

  /**
   * Dispatches a relay command with safety pending-timeout.
   * If the device does not confirm the new state within 5s,
   * the pending state is reverted and an error is registered.
   */
  public sendRelayCommand(deviceId: string, relayIndex: number, targetValue: 0 | 1): Promise<void> {
    return new Promise((resolve, reject) => {
      // 1. Mark relay as pending in Zustand store
      useDeviceStore.getState().setPendingRelay(deviceId, relayIndex, true);
      useDeviceStore.getState().setError(deviceId, null);

      // Clean up any existing timer for this relay channel
      this.clearPendingRequest(deviceId, relayIndex);

      // 2. Setup 5s confirmation timeout
      const timer = setTimeout(() => {
        // Revert pending state
        useDeviceStore.getState().setPendingRelay(deviceId, relayIndex, false);
        const timeoutError = `Relay ${relayIndex} command timed out after 5s without device confirmation.`;
        useDeviceStore.getState().setError(deviceId, timeoutError);

        const deviceMap = this.pendingRelays.get(deviceId);
        if (deviceMap) {
          deviceMap.delete(relayIndex);
        }

        reject(new Error(timeoutError));
      }, CONFIRMATION_TIMEOUT_MS);

      // Store pending tracking
      let deviceMap = this.pendingRelays.get(deviceId);
      if (!deviceMap) {
        deviceMap = new Map();
        this.pendingRelays.set(deviceId, deviceMap);
      }

      deviceMap.set(relayIndex, {
        relayIndex,
        targetValue,
        timer,
        resolve,
        reject,
      });

      // 3. Publish MQTT command
      const cmd: RelayCommand = {
        relay: relayIndex,
        v: targetValue,
      };

      this.client.publishCommand(deviceId, cmd).catch((err) => {
        clearTimeout(timer);
        deviceMap?.delete(relayIndex);
        useDeviceStore.getState().setPendingRelay(deviceId, relayIndex, false);
        useDeviceStore.getState().setError(deviceId, `Publish failed: ${err.message}`);
        reject(err);
      });
    });
  }

  /**
   * Checks incoming state payload to resolve matching pending relays.
   */
  public handleStateConfirmation(deviceId: string, state: { relays: number[] }): void {
    const deviceMap = this.pendingRelays.get(deviceId);
    if (!deviceMap || deviceMap.size === 0) return;

    deviceMap.forEach((req, relayIndex) => {
      // Handle both 1-indexed (channel 1 -> relays[0]) and 0-indexed conventions
      const actualValue =
        relayIndex >= 1 && relayIndex <= 8
          ? state.relays[relayIndex - 1]
          : state.relays[relayIndex];

      if (actualValue === req.targetValue) {
        clearTimeout(req.timer);
        useDeviceStore.getState().setPendingRelay(deviceId, relayIndex, false);
        req.resolve();
        deviceMap.delete(relayIndex);
      }
    });
  }

  /**
   * Throttles slider and color commands to 1 per 150 ms,
   * guaranteeing that the final value on touch release is always published.
   */
  public sendLedCommand(
    deviceId: string,
    ledIndex: number,
    on: 0 | 1,
    br: number,
    rgb: [number, number, number],
    fx: number
  ): void {
    const key = `${deviceId}_${ledIndex}`;
    let throttled = this.throttledLedPublishers.get(key);

    if (!throttled) {
      throttled = throttle((...args: unknown[]) => {
        const [targetDevId, targetLed, targetOn, targetBr, targetRgb, targetFx] = args as [
          string,
          number,
          0 | 1,
          number,
          [number, number, number],
          number,
        ];

        const cmd: LedCommand = {
          led: targetLed,
          on: targetOn,
          br: targetBr,
          rgb: targetRgb,
          fx: targetFx,
        };

        this.client.publishCommand(targetDevId, cmd).catch((err) => {
          console.warn(`[CommandManager] LED command failed for ${targetDevId}:`, err);
        });
      }, LED_COMMAND_THROTTLE_MS);

      this.throttledLedPublishers.set(key, throttled);
    }

    throttled(deviceId, ledIndex, on, br, rgb, fx);
  }

  private clearPendingRequest(deviceId: string, relayIndex: number) {
    const deviceMap = this.pendingRelays.get(deviceId);
    if (deviceMap) {
      const existing = deviceMap.get(relayIndex);
      if (existing) {
        clearTimeout(existing.timer);
        deviceMap.delete(relayIndex);
      }
    }
  }

  public cleanup(): void {
    this.pendingRelays.forEach((deviceMap) => {
      deviceMap.forEach((req) => clearTimeout(req.timer));
      deviceMap.clear();
    });
    this.pendingRelays.clear();

    this.throttledLedPublishers.forEach((throttled) => throttled.cancel());
    this.throttledLedPublishers.clear();
  }
}

export const commandManager = new CommandManager(defaultClient);
