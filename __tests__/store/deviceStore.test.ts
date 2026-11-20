import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ASYNC_STORAGE_DEVICE_STATE_KEY,
  selectActiveError,
  selectActiveFault,
  selectActiveLeds,
  selectActivePendingRelays,
  selectActiveRelays,
  selectActiveStatus,
  selectActiveTelemetry,
  selectConnectionState,
  useDeviceStore,
} from '../../src/store/deviceStore';

describe('Zustand Device Store & Reducers', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    useDeviceStore.getState().setActiveDeviceId('DEV-SURAXA-01');
  });

  it('updates connection state properly', () => {
    expect(selectConnectionState(useDeviceStore.getState())).toBe('offline');

    useDeviceStore.getState().setConnection('connecting');
    expect(selectConnectionState(useDeviceStore.getState())).toBe('connecting');

    useDeviceStore.getState().setConnection('connected');
    expect(selectConnectionState(useDeviceStore.getState())).toBe('connected');
  });

  it('updates telemetry and tracks lastUpdated timestamp', () => {
    const telemetry = { t: 26.8, h: 52.3, ts: 1732000000 };
    useDeviceStore.getState().updateTelemetry('DEV-SURAXA-01', telemetry);

    const activeTelemetry = selectActiveTelemetry(useDeviceStore.getState());
    expect(activeTelemetry).toEqual(telemetry);
    expect(useDeviceStore.getState().devices['DEV-SURAXA-01'].lastUpdated).toBeGreaterThan(0);
  });

  it('updates state and automatically clears matching pending relay channels', () => {
    // Mark channel 3 as pending
    useDeviceStore.getState().setPendingRelay('DEV-SURAXA-01', 3, true);
    expect(selectActivePendingRelays(useDeviceStore.getState())[3]).toBe(true);

    const newState = {
      relays: [0, 0, 1, 0, 0, 0, 0, 0], // Relay 3 confirmed ON
      led: [
        { on: 1, br: 80, rgb: [255, 0, 0] as [number, number, number], fx: 0 },
        { on: 0, br: 50, rgb: [0, 0, 255] as [number, number, number], fx: 2 },
      ],
      fault: null,
    };

    useDeviceStore.getState().updateState('DEV-SURAXA-01', newState);

    expect(selectActiveRelays(useDeviceStore.getState())).toEqual([0, 0, 1, 0, 0, 0, 0, 0]);
    expect(selectActiveLeds(useDeviceStore.getState())).toEqual(newState.led);
    expect(selectActiveFault(useDeviceStore.getState())).toBeNull();

    // Verified: confirmed state clears pending relay
    expect(selectActivePendingRelays(useDeviceStore.getState())[3]).toBeUndefined();
  });

  it('updates device status', () => {
    useDeviceStore.getState().updateStatus('DEV-SURAXA-01', 'online');
    expect(selectActiveStatus(useDeviceStore.getState())).toBe('online');

    useDeviceStore.getState().updateStatus('DEV-SURAXA-01', 'offline');
    expect(selectActiveStatus(useDeviceStore.getState())).toBe('offline');
  });

  it('sets and clears error state', () => {
    useDeviceStore.getState().setError('DEV-SURAXA-01', 'Test Error');
    expect(selectActiveError(useDeviceStore.getState())).toBe('Test Error');

    useDeviceStore.getState().setError('DEV-SURAXA-01', null);
    expect(selectActiveError(useDeviceStore.getState())).toBeNull();
  });

  it('persists state to AsyncStorage and hydrates on launch', async () => {
    const cachedState = {
      devices: {
        'DEV-CACHE-01': {
          id: 'DEV-CACHE-01',
          name: 'Cached ICU Unit',
          telemetry: { t: 28.1, h: 49.0, ts: 1732001111 },
          relays: [1, 0, 1, 0, 0, 0, 0, 0],
          pendingRelays: {},
          leds: [
            { on: 1, br: 90, rgb: [0, 255, 0], fx: 0 },
            { on: 1, br: 90, rgb: [0, 255, 0], fx: 0 },
          ],
          fault: null,
          status: 'online',
          lastUpdated: 1732001111000,
          error: null,
        },
      },
      activeDeviceId: 'DEV-CACHE-01',
    };

    await AsyncStorage.setItem(ASYNC_STORAGE_DEVICE_STATE_KEY, JSON.stringify(cachedState));

    // Hydrate store from AsyncStorage
    await useDeviceStore.getState().hydrate();

    expect(useDeviceStore.getState().isHydrated).toBe(true);
    expect(useDeviceStore.getState().activeDeviceId).toBe('DEV-CACHE-01');
    expect(selectActiveTelemetry(useDeviceStore.getState())).toEqual({
      t: 28.1,
      h: 49.0,
      ts: 1732001111,
    });
    expect(selectActiveRelays(useDeviceStore.getState())).toEqual([1, 0, 1, 0, 0, 0, 0, 0]);
  });
});
