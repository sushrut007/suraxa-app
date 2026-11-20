import {
  parseStatePayload,
  parseStatusPayload,
  parseTelemetryPayload,
  parseTopic,
} from '../../src/services/mqtt/payloadParser';

describe('MQTT Payload Parser', () => {
  describe('parseTelemetryPayload', () => {
    it('successfully parses valid telemetry payload', () => {
      const raw = JSON.stringify({ t: 27.4, h: 55.2, ts: 1732000000 });
      const parsed = parseTelemetryPayload(raw);

      expect(parsed).not.toBeNull();
      expect(parsed?.t).toBe(27.4);
      expect(parsed?.h).toBe(55.2);
      expect(parsed?.ts).toBe(1732000000);
    });

    it('parses from Buffer input', () => {
      const raw = Buffer.from(JSON.stringify({ t: 25.0, h: 60.0, ts: 1732000050 }));
      const parsed = parseTelemetryPayload(raw);

      expect(parsed).toEqual({ t: 25.0, h: 60.0, ts: 1732000050 });
    });

    it('rejects malformed JSON string safely without throwing', () => {
      expect(parseTelemetryPayload('not a json string')).toBeNull();
      expect(parseTelemetryPayload('{ t: 27.4, invalid }')).toBeNull();
      expect(parseTelemetryPayload(null)).toBeNull();
      expect(parseTelemetryPayload(undefined)).toBeNull();
    });

    it('rejects payloads missing required fields', () => {
      expect(parseTelemetryPayload(JSON.stringify({ t: 27.4 }))).toBeNull();
      expect(parseTelemetryPayload(JSON.stringify({ h: 55.2 }))).toBeNull();
      expect(parseTelemetryPayload(JSON.stringify({ ts: 1732000000 }))).toBeNull();
    });

    it('rejects payloads with non-numeric or non-finite values', () => {
      expect(
        parseTelemetryPayload(JSON.stringify({ t: '27.4', h: 55.2, ts: 1732000000 }))
      ).toBeNull();
      expect(parseTelemetryPayload(JSON.stringify({ t: NaN, h: 55.2, ts: 1732000000 }))).toBeNull();
      expect(parseTelemetryPayload(JSON.stringify({ t: 27.4, h: 55.2, ts: -100 }))).toBeNull();
    });
  });

  describe('parseStatePayload', () => {
    const validState = {
      relays: [0, 0, 0, 0, 0, 0, 0, 0],
      led: [
        { on: 1, br: 80, rgb: [255, 0, 0], fx: 0 },
        { on: 0, br: 50, rgb: [0, 0, 255], fx: 2 },
      ],
      fault: null,
    };

    it('successfully parses valid state payload with null fault', () => {
      const parsed = parseStatePayload(JSON.stringify(validState));
      expect(parsed).toEqual(validState);
    });

    it('successfully parses valid state payload with fault string', () => {
      const faulted = { ...validState, fault: 'DOOR_INTERLOCK_OPEN' };
      const parsed = parseStatePayload(JSON.stringify(faulted));
      expect(parsed?.fault).toBe('DOOR_INTERLOCK_OPEN');
    });

    it('rejects malformed JSON', () => {
      expect(parseStatePayload('{{broken-json')).toBeNull();
    });

    it('rejects relays array with length not equal to 8', () => {
      const invalidRelays = { ...validState, relays: [0, 1, 0] };
      expect(parseStatePayload(JSON.stringify(invalidRelays))).toBeNull();
    });

    it('rejects relays containing non-binary numbers', () => {
      const invalidRelayValues = { ...validState, relays: [0, 1, 2, 0, 0, 0, 0, 0] };
      expect(parseStatePayload(JSON.stringify(invalidRelayValues))).toBeNull();
    });

    it('rejects led with invalid RGB tuple', () => {
      const invalidRgb = {
        ...validState,
        led: [{ on: 1, br: 80, rgb: [255, 0, 300], fx: 0 }], // 300 > 255
      };
      expect(parseStatePayload(JSON.stringify(invalidRgb))).toBeNull();

      const shortRgb = {
        ...validState,
        led: [{ on: 1, br: 80, rgb: [255, 0], fx: 0 }], // only 2 items
      };
      expect(parseStatePayload(JSON.stringify(shortRgb))).toBeNull();
    });

    it('rejects non-string/non-null fault values', () => {
      const invalidFault = { ...validState, fault: 12345 };
      expect(parseStatePayload(JSON.stringify(invalidFault))).toBeNull();
    });
  });

  describe('parseStatusPayload', () => {
    it('parses "online" and "offline" strings', () => {
      expect(parseStatusPayload('online')).toBe('online');
      expect(parseStatusPayload('offline')).toBe('offline');
      expect(parseStatusPayload('"online"')).toBe('online');
      expect(parseStatusPayload('"offline"')).toBe('offline');
    });

    it('parses from Buffer', () => {
      expect(parseStatusPayload(Buffer.from('online'))).toBe('online');
      expect(parseStatusPayload(Buffer.from('offline'))).toBe('offline');
    });

    it('rejects invalid status values', () => {
      expect(parseStatusPayload('standby')).toBeNull();
      expect(parseStatusPayload('')).toBeNull();
      expect(parseStatusPayload('1')).toBeNull();
      expect(parseStatusPayload(null)).toBeNull();
    });
  });

  describe('parseTopic', () => {
    it('correctly parses Suraxa topics', () => {
      expect(parseTopic('suraxa/DEV-001/telemetry')).toEqual({
        deviceId: 'DEV-001',
        channel: 'telemetry',
      });
      expect(parseTopic('suraxa/ICU-UNIT-2/state')).toEqual({
        deviceId: 'ICU-UNIT-2',
        channel: 'state',
      });
      expect(parseTopic('suraxa/DEV_99/cmd')).toEqual({
        deviceId: 'DEV_99',
        channel: 'cmd',
      });
      expect(parseTopic('suraxa/DEV-001/status')).toEqual({
        deviceId: 'DEV-001',
        channel: 'status',
      });
    });

    it('rejects invalid topics', () => {
      expect(parseTopic('other/DEV-001/telemetry')).toBeNull();
      expect(parseTopic('suraxa/DEV-001')).toBeNull();
      expect(parseTopic('suraxa/DEV-001/unknown_channel')).toBeNull();
      expect(parseTopic('')).toBeNull();
    });
  });
});
