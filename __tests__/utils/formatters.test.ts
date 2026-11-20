import {
  celsiusToFahrenheit,
  formatHumidity,
  formatRelativeTime,
  formatTemperature,
  isDataStale,
} from '../../src/utils/formatters';

describe('Formatters Utility', () => {
  describe('celsiusToFahrenheit', () => {
    it('converts 0°C to 32°F', () => {
      expect(celsiusToFahrenheit(0)).toBe(32);
    });

    it('converts 100°C to 212°F', () => {
      expect(celsiusToFahrenheit(100)).toBe(212);
    });

    it('converts 25°C to 77°F', () => {
      expect(celsiusToFahrenheit(25)).toBe(77);
    });
  });

  describe('formatTemperature', () => {
    it('formats Celsius correctly', () => {
      expect(formatTemperature(27.4, 'C')).toBe('27.4 °C');
      expect(formatTemperature(27.456, 'C', 2)).toBe('27.46 °C');
    });

    it('formats Fahrenheit correctly', () => {
      // 25°C = 77.0°F
      expect(formatTemperature(25.0, 'F')).toBe('77.0 °F');
    });

    it('handles null, undefined, or invalid numbers gracefully', () => {
      expect(formatTemperature(null, 'C')).toBe('--.- °C');
      expect(formatTemperature(undefined, 'F')).toBe('--.- °F');
      expect(formatTemperature(NaN, 'C')).toBe('--.- °C');
    });
  });

  describe('formatHumidity', () => {
    it('formats relative humidity with default precision', () => {
      expect(formatHumidity(55.2)).toBe('55.2 % RH');
    });

    it('handles custom precision', () => {
      expect(formatHumidity(55.258, 2)).toBe('55.26 % RH');
    });

    it('handles null and undefined gracefully', () => {
      expect(formatHumidity(null)).toBe('--.- % RH');
      expect(formatHumidity(undefined)).toBe('--.- % RH');
    });
  });

  describe('formatRelativeTime', () => {
    const fixedNow = 1732000000000; // Reference ms

    it('returns "Never" for 0 or null timestamp', () => {
      expect(formatRelativeTime(null, fixedNow)).toBe('Never');
      expect(formatRelativeTime(0, fixedNow)).toBe('Never');
    });

    it('returns "Just now" for updates under 5 seconds old', () => {
      expect(formatRelativeTime(fixedNow - 3000, fixedNow)).toBe('Just now');
    });

    it('returns seconds ago for updates between 5 and 59 seconds', () => {
      expect(formatRelativeTime(fixedNow - 15000, fixedNow)).toBe('15 s ago');
      expect(formatRelativeTime(fixedNow - 59000, fixedNow)).toBe('59 s ago');
    });

    it('returns minutes ago for updates between 1 and 59 minutes', () => {
      expect(formatRelativeTime(fixedNow - 120000, fixedNow)).toBe('2 m ago');
      expect(formatRelativeTime(fixedNow - 3500000, fixedNow)).toBe('58 m ago');
    });

    it('returns hours ago for older updates', () => {
      expect(formatRelativeTime(fixedNow - 7200000, fixedNow)).toBe('2 h ago');
    });
  });

  describe('isDataStale', () => {
    const now = 1000000;

    it('returns true if device status is offline regardless of age', () => {
      expect(isDataStale(now, 'offline', 10, now)).toBe(true);
    });

    it('returns true if lastUpdated is missing or 0', () => {
      expect(isDataStale(null, 'online', 10, now)).toBe(true);
      expect(isDataStale(0, 'online', 10, now)).toBe(true);
    });

    it('returns false if online and fresh within threshold', () => {
      // 5 seconds old, threshold 10 seconds
      expect(isDataStale(now - 5000, 'online', 10, now)).toBe(false);
    });

    it('returns true if online but exceeds threshold (stale cache)', () => {
      // 15 seconds old, threshold 10 seconds
      expect(isDataStale(now - 15000, 'online', 10, now)).toBe(true);
    });
  });
});
