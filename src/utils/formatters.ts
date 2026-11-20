export type TemperatureUnit = 'C' | 'F';

/**
 * Converts Celsius to Fahrenheit.
 */
export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

/**
 * Formats a temperature value with unit symbol.
 * Example: 27.4°C or 81.3°F
 */
export function formatTemperature(
  celsius: number | null | undefined,
  unit: TemperatureUnit = 'C',
  precision = 1
): string {
  if (celsius === null || celsius === undefined || !Number.isFinite(celsius)) {
    return `--.- °${unit}`;
  }

  const value = unit === 'F' ? celsiusToFahrenheit(celsius) : celsius;
  return `${value.toFixed(precision)} °${unit}`;
}

/**
 * Formats a relative humidity value.
 * Example: 55.2 % RH
 */
export function formatHumidity(humidity: number | null | undefined, precision = 1): string {
  if (humidity === null || humidity === undefined || !Number.isFinite(humidity)) {
    return '--.- % RH';
  }

  return `${humidity.toFixed(precision)} % RH`;
}

/**
 * Formats a millisecond timestamp to a relative time string.
 * Example: "Just now", "3 s ago", "2 m ago", "1 h ago"
 */
export function formatRelativeTime(
  timestampMs: number | null | undefined,
  nowMs: number = Date.now()
): string {
  if (!timestampMs || timestampMs <= 0) {
    return 'Never';
  }

  const diffSec = Math.max(0, Math.floor((nowMs - timestampMs) / 1000));

  if (diffSec < 5) {
    return 'Just now';
  }
  if (diffSec < 60) {
    return `${diffSec} s ago`;
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin} m ago`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `${diffHours} h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} d ago`;
}

/**
 * Determines whether telemetry data is stale.
 * Returns true if device is offline OR if last update exceeded the stale threshold (default 10s).
 */
export function isDataStale(
  lastUpdatedMs: number | null | undefined,
  status: 'online' | 'offline',
  staleThresholdSec = 10,
  nowMs: number = Date.now()
): boolean {
  if (status === 'offline') {
    return true;
  }

  if (!lastUpdatedMs || lastUpdatedMs <= 0) {
    return true;
  }

  const ageMs = nowMs - lastUpdatedMs;
  return ageMs > staleThresholdSec * 1000;
}
