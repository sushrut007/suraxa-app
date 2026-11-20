import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import {
  ConnectionStatusBar,
  FaultBanner,
  HumidityCard,
  TemperatureCard,
} from '../../src/features/telemetry';
import { useDeviceStore, useSettingsStore } from '../../src/store';

describe('Dashboard Telemetry Components', () => {
  const DEVICE_ID = 'TEST-DEV-01';

  beforeEach(() => {
    useDeviceStore.getState().setActiveDeviceId(DEVICE_ID);
    useDeviceStore.getState().setError(DEVICE_ID, null);
    useSettingsStore.getState().setTemperatureUnit('C');
  });

  describe('FaultBanner', () => {
    it('does not render when fault is null', async () => {
      useDeviceStore.getState().updateState(DEVICE_ID, {
        relays: [0, 0, 0, 0, 0, 0, 0, 0],
        led: [
          { on: 0, br: 50, rgb: [0, 0, 0], fx: 0 },
          { on: 0, br: 50, rgb: [0, 0, 0], fx: 0 },
        ],
        fault: null,
      });

      const { queryByTestId } = await render(<FaultBanner />);
      expect(queryByTestId('fault-banner')).toBeNull();
    });

    it('renders prominent warning when fault is active', async () => {
      useDeviceStore.getState().updateState(DEVICE_ID, {
        relays: [0, 0, 0, 0, 0, 0, 0, 0],
        led: [
          { on: 0, br: 50, rgb: [0, 0, 0], fx: 0 },
          { on: 0, br: 50, rgb: [0, 0, 0], fx: 0 },
        ],
        fault: 'DOOR_INTERLOCK_OPEN',
      });

      const { getByTestId, getByText } = await render(<FaultBanner />);
      expect(getByTestId('fault-banner')).toBeTruthy();
      expect(getByText(/CRITICAL HARDWARE FAULT: DOOR_INTERLOCK_OPEN/i)).toBeTruthy();
      expect(getByText(/Firmware safety interlock is active/i)).toBeTruthy();
    });
  });

  describe('ConnectionStatusBar & Stale Marker', () => {
    it('shows STALE DATA marker when device is offline', async () => {
      useDeviceStore.getState().updateStatus(DEVICE_ID, 'offline');

      const { getByTestId, getByText } = await render(<ConnectionStatusBar />);
      expect(getByTestId('connection-status-bar')).toBeTruthy();
      expect(getByTestId('stale-marker-badge')).toBeTruthy();
      expect(getByText('STALE DATA')).toBeTruthy();
    });

    it('hides STALE DATA marker when device is online with fresh reading', async () => {
      useDeviceStore.getState().updateStatus(DEVICE_ID, 'online');
      useDeviceStore.getState().updateTelemetry(DEVICE_ID, {
        t: 26.5,
        h: 53.0,
        ts: Math.floor(Date.now() / 1000),
      });

      const { queryByTestId } = await render(<ConnectionStatusBar />);
      expect(queryByTestId('stale-marker-badge')).toBeNull();
    });
  });

  describe('TemperatureCard', () => {
    it('renders temperature in Celsius and toggles to Fahrenheit on press', async () => {
      useDeviceStore.getState().updateStatus(DEVICE_ID, 'online');
      useDeviceStore.getState().updateTelemetry(DEVICE_ID, {
        t: 25.0, // 25°C = 77°F
        h: 50.0,
        ts: 1732000000,
      });

      const { getByTestId, getByText, findByText } = await render(<TemperatureCard />);
      expect(getByTestId('temperature-card')).toBeTruthy();
      expect(getByText('25.0 °C')).toBeTruthy();

      // Press unit toggle button
      const toggleBtn = getByTestId('temp-unit-toggle');
      fireEvent.press(toggleBtn);

      // Verify toggled to Fahrenheit
      expect(useSettingsStore.getState().temperatureUnit).toBe('F');
      expect(await findByText('77.0 °F')).toBeTruthy();
    });

    it('renders stale badge when device is offline', async () => {
      useDeviceStore.getState().updateStatus(DEVICE_ID, 'offline');
      useDeviceStore.getState().updateTelemetry(DEVICE_ID, {
        t: 24.2,
        h: 51.0,
        ts: 1732000000,
      });

      const { getByTestId } = await render(<TemperatureCard />);
      expect(getByTestId('temp-stale-marker')).toBeTruthy();
    });
  });

  describe('HumidityCard', () => {
    it('renders humidity and indicates optimal ICU cleanroom range', async () => {
      useDeviceStore.getState().updateStatus(DEVICE_ID, 'online');
      useDeviceStore.getState().updateTelemetry(DEVICE_ID, {
        t: 25.0,
        h: 55.0, // In 40-60% optimal band
        ts: 1732000000,
      });

      const { getByTestId, getByText } = await render(<HumidityCard />);
      expect(getByTestId('humidity-card')).toBeTruthy();
      expect(getByText('55.0 % RH')).toBeTruthy();
      expect(getByText('OPTIMAL ICU BAND')).toBeTruthy();
    });

    it('indicates target band when humidity is outside optimal range', async () => {
      useDeviceStore.getState().updateTelemetry(DEVICE_ID, {
        t: 25.0,
        h: 72.0, // High humidity > 60%
        ts: 1732000000,
      });

      const { getByText } = await render(<HumidityCard />);
      expect(getByText('72.0 % RH')).toBeTruthy();
      expect(getByText('TARGET: 40-60%')).toBeTruthy();
    });
  });
});
