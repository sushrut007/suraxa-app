import { LedStripState, ParsedTopic, StatePayload, StatusPayload, TelemetryPayload } from './types';

/**
 * Safely parses any raw string or buffer into JSON.
 * Returns null if parsing fails, preventing crashes from malformed inputs.
 */
function safeJsonParse(raw: unknown): unknown | null {
  if (typeof raw !== 'string') {
    if (
      raw instanceof Buffer ||
      (raw && typeof (raw as { toString: () => string }).toString === 'function')
    ) {
      raw = (raw as { toString: () => string }).toString();
    } else {
      return null;
    }
  }

  try {
    return JSON.parse(raw as string);
  } catch {
    return null;
  }
}

/**
 * Validates and extracts a TelemetryPayload from raw MQTT message.
 * Spec: suraxa/<id>/telemetry -> {"t":27.4,"h":55.2,"ts":1732000000}
 */
export function parseTelemetryPayload(raw: unknown): TelemetryPayload | null {
  const data = safeJsonParse(raw);
  if (!data || typeof data !== 'object') {
    return null;
  }

  const obj = data as Record<string, unknown>;

  const t = typeof obj.t === 'number' && Number.isFinite(obj.t) ? obj.t : null;
  const h = typeof obj.h === 'number' && Number.isFinite(obj.h) ? obj.h : null;
  const ts = typeof obj.ts === 'number' && Number.isFinite(obj.ts) && obj.ts > 0 ? obj.ts : null;

  if (t === null || h === null || ts === null) {
    return null;
  }

  return { t, h, ts };
}

/**
 * Validates a single LED strip state object.
 */
function isValidLedStrip(item: unknown): item is LedStripState {
  if (!item || typeof item !== 'object') {
    return false;
  }

  const obj = item as Record<string, unknown>;
  const on = obj.on === 0 || obj.on === 1 ? obj.on : null;
  const br = typeof obj.br === 'number' && Number.isFinite(obj.br) && obj.br >= 0 ? obj.br : null;
  const fx = typeof obj.fx === 'number' && Number.isFinite(obj.fx) && obj.fx >= 0 ? obj.fx : null;

  if (on === null || br === null || fx === null) {
    return false;
  }

  if (!Array.isArray(obj.rgb) || obj.rgb.length !== 3) {
    return false;
  }

  const isValidRgb = obj.rgb.every(
    (c) => typeof c === 'number' && Number.isInteger(c) && c >= 0 && c <= 255
  );

  return isValidRgb;
}

/**
 * Validates and extracts a StatePayload from raw MQTT message.
 * Spec: suraxa/<id>/state -> retained {"relays":[0,0,0,0,0,0,0,0],"led":[{"on":1,"br":80,"rgb":[255,0,0],"fx":0},{"on":0,"br":50,"rgb":[0,0,255],"fx":2}],"fault":null}
 */
export function parseStatePayload(raw: unknown): StatePayload | null {
  const data = safeJsonParse(raw);
  if (!data || typeof data !== 'object') {
    return null;
  }

  const obj = data as Record<string, unknown>;

  // Validate relays: must be an array of numbers (typically 8 channels, 0 or 1)
  if (!Array.isArray(obj.relays) || obj.relays.length !== 8) {
    return null;
  }

  const validRelays = obj.relays.every((r) => typeof r === 'number' && (r === 0 || r === 1));
  if (!validRelays) {
    return null;
  }

  // Validate leds: array of LED strip states
  if (!Array.isArray(obj.led) || obj.led.length === 0) {
    return null;
  }

  const validLeds = obj.led.every(isValidLedStrip);
  if (!validLeds) {
    return null;
  }

  // Validate fault: must be null or string
  if (obj.fault !== null && typeof obj.fault !== 'string') {
    return null;
  }

  return {
    relays: obj.relays as number[],
    led: obj.led as LedStripState[],
    fault: obj.fault,
  };
}

/**
 * Validates and extracts a StatusPayload from raw MQTT message.
 * Spec: suraxa/<id>/status -> retained "online" / "offline"
 */
export function parseStatusPayload(raw: unknown): StatusPayload | null {
  let str = '';
  if (typeof raw === 'string') {
    str = raw.trim();
  } else if (
    raw instanceof Buffer ||
    (raw && typeof (raw as { toString: () => string }).toString === 'function')
  ) {
    str = (raw as { toString: () => string }).toString().trim();
  } else {
    return null;
  }

  // Strip wrapping quotes if sent as JSON string
  if (str.startsWith('"') && str.endsWith('"')) {
    str = str.slice(1, -1).trim();
  }

  if (str === 'online' || str === 'offline') {
    return str;
  }

  return null;
}

/**
 * Parses a Suraxa topic into device ID and channel.
 * Spec: suraxa/<deviceId>/<telemetry|state|cmd|status>
 */
export function parseTopic(topic: string): ParsedTopic | null {
  if (typeof topic !== 'string') {
    return null;
  }

  const parts = topic.split('/');
  if (parts.length !== 3 || parts[0] !== 'suraxa') {
    return null;
  }

  const [, deviceId, channel] = parts;
  if (!deviceId || !['telemetry', 'state', 'cmd', 'status'].includes(channel)) {
    return null;
  }

  return {
    deviceId,
    channel: channel as ParsedTopic['channel'],
  };
}
