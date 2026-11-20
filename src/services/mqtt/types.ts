export type MqttConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'offline';

export interface TelemetryPayload {
  t: number; // Temperature in °C
  h: number; // Relative Humidity in %RH
  ts: number; // Timestamp in seconds
}

export interface LedStripState {
  on: number; // 0 or 1
  br: number; // Brightness 0 - 100 or 0 - 255
  rgb: [number, number, number]; // [R, G, B]
  fx: number; // Effect ID
}

export interface StatePayload {
  relays: number[]; // Array of 8 binary values: 0 (OFF) or 1 (ON)
  led: LedStripState[]; // Array of 2 LED strip states
  fault: string | null; // null if normal, fault description if active
}

export type StatusPayload = 'online' | 'offline';

export interface RelayCommand {
  relay: number; // Relay channel (e.g. 1 through 8)
  v: 0 | 1; // 0 for OFF, 1 for ON
}

export interface LedCommand {
  led: number; // LED strip index (1 or 2)
  on: 0 | 1; // Power state
  br: number; // Brightness
  rgb: [number, number, number]; // [R, G, B]
  fx: number; // Effect ID
}

export type CommandPayload = RelayCommand | LedCommand;

export interface ParsedTopic {
  deviceId: string;
  channel: 'telemetry' | 'state' | 'cmd' | 'status';
}

export interface MqttClientOptions {
  brokerUrl: string;
  username?: string;
  password?: string;
  clientIdPrefix?: string;
  keepalive?: number;
  connectTimeout?: number;
}
