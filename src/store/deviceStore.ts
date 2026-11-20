import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
  LedStripState,
  MqttConnectionState,
  StatePayload,
  StatusPayload,
  TelemetryPayload,
} from '../services/mqtt/types';

export const ASYNC_STORAGE_DEVICE_STATE_KEY = '@suraxa_device_state_v1';

export interface DeviceRealtimeState {
  id: string;
  name: string;
  telemetry: TelemetryPayload | null;
  relays: number[]; // 8 binary channels
  pendingRelays: Record<number, boolean>; // Pending confirmation per channel
  leds: LedStripState[];
  fault: string | null;
  status: StatusPayload;
  lastUpdated: number | null;
  error: string | null;
}

export interface DeviceStoreState {
  connection: MqttConnectionState;
  activeDeviceId: string;
  devices: Record<string, DeviceRealtimeState>;
  isHydrated: boolean;

  // Actions
  setConnection: (connection: MqttConnectionState) => void;
  setActiveDeviceId: (id: string) => void;
  updateTelemetry: (deviceId: string, telemetry: TelemetryPayload) => void;
  updateState: (deviceId: string, state: StatePayload) => void;
  updateStatus: (deviceId: string, status: StatusPayload) => void;
  setPendingRelay: (deviceId: string, channel: number, pending: boolean) => void;
  clearPendingRelays: (deviceId: string) => void;
  setError: (deviceId: string, error: string | null) => void;
  hydrate: () => Promise<void>;
}

const DEFAULT_DEVICE_ID = 'DEV-SURAXA-01';

const createDefaultDeviceState = (
  id = DEFAULT_DEVICE_ID,
  name = 'Suraxa Unit 01 (ICU Cleanroom)'
): DeviceRealtimeState => ({
  id,
  name,
  telemetry: null,
  relays: [0, 0, 0, 0, 0, 0, 0, 0],
  pendingRelays: {},
  leds: [
    { on: 0, br: 50, rgb: [0, 255, 128], fx: 0 },
    { on: 0, br: 50, rgb: [0, 128, 255], fx: 0 },
  ],
  fault: null,
  status: 'offline',
  lastUpdated: null,
  error: null,
});

/**
 * Persists cached device states to AsyncStorage asynchronously.
 */
async function persistDeviceStates(
  devices: Record<string, DeviceRealtimeState>,
  activeDeviceId: string
): Promise<void> {
  try {
    const serialized = JSON.stringify({ devices, activeDeviceId });
    await AsyncStorage.setItem(ASYNC_STORAGE_DEVICE_STATE_KEY, serialized);
  } catch (err) {
    console.warn('[Store] Failed to persist device state to AsyncStorage:', err);
  }
}

export const useDeviceStore = create<DeviceStoreState>((set, get) => ({
  connection: 'offline',
  activeDeviceId: DEFAULT_DEVICE_ID,
  devices: {
    [DEFAULT_DEVICE_ID]: createDefaultDeviceState(),
  },
  isHydrated: false,

  setConnection: (connection) => set({ connection }),

  setActiveDeviceId: (id) => {
    set((state) => {
      const existing = state.devices[id] || createDefaultDeviceState(id, `Suraxa Unit (${id})`);
      const nextDevices = { ...state.devices, [id]: existing };
      persistDeviceStates(nextDevices, id);
      return { activeDeviceId: id, devices: nextDevices };
    });
  },

  updateTelemetry: (deviceId, telemetry) => {
    set((state) => {
      const current = state.devices[deviceId] || createDefaultDeviceState(deviceId);
      const updated: DeviceRealtimeState = {
        ...current,
        telemetry,
        lastUpdated: Date.now(),
      };
      const nextDevices = { ...state.devices, [deviceId]: updated };
      persistDeviceStates(nextDevices, state.activeDeviceId);
      return { devices: nextDevices };
    });
  },

  updateState: (deviceId, payload) => {
    set((state) => {
      const current = state.devices[deviceId] || createDefaultDeviceState(deviceId);

      // When confirmation state arrives from device, clear any pending relay flags
      // that now match the confirmed state!
      const nextPending = { ...current.pendingRelays };
      payload.relays.forEach((val, idx) => {
        // Channel can be 1-indexed (1..8) or 0-indexed (0..7)
        const channel1Indexed = idx + 1;
        if (nextPending[channel1Indexed] !== undefined) {
          delete nextPending[channel1Indexed];
        }
        if (nextPending[idx] !== undefined) {
          delete nextPending[idx];
        }
      });

      const updated: DeviceRealtimeState = {
        ...current,
        relays: payload.relays,
        leds: payload.led,
        fault: payload.fault,
        pendingRelays: nextPending,
        lastUpdated: Date.now(),
        // Clear any previous relay timeout error once fresh state arrives
        error: payload.fault ? `Device Fault: ${payload.fault}` : null,
      };

      const nextDevices = { ...state.devices, [deviceId]: updated };
      persistDeviceStates(nextDevices, state.activeDeviceId);
      return { devices: nextDevices };
    });
  },

  updateStatus: (deviceId, status) => {
    set((state) => {
      const current = state.devices[deviceId] || createDefaultDeviceState(deviceId);
      const updated: DeviceRealtimeState = {
        ...current,
        status,
        lastUpdated: Date.now(),
      };
      const nextDevices = { ...state.devices, [deviceId]: updated };
      persistDeviceStates(nextDevices, state.activeDeviceId);
      return { devices: nextDevices };
    });
  },

  setPendingRelay: (deviceId, channel, pending) => {
    set((state) => {
      const current = state.devices[deviceId] || createDefaultDeviceState(deviceId);
      const nextPending = { ...current.pendingRelays };
      if (pending) {
        nextPending[channel] = true;
      } else {
        delete nextPending[channel];
      }
      const updated: DeviceRealtimeState = {
        ...current,
        pendingRelays: nextPending,
      };
      return { devices: { ...state.devices, [deviceId]: updated } };
    });
  },

  clearPendingRelays: (deviceId) => {
    set((state) => {
      const current = state.devices[deviceId];
      if (!current) return state;
      return {
        devices: {
          ...state.devices,
          [deviceId]: { ...current, pendingRelays: {} },
        },
      };
    });
  },

  setError: (deviceId, error) => {
    set((state) => {
      const current = state.devices[deviceId] || createDefaultDeviceState(deviceId);
      return {
        devices: {
          ...state.devices,
          [deviceId]: { ...current, error },
        },
      };
    });
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(ASYNC_STORAGE_DEVICE_STATE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          devices: Record<string, DeviceRealtimeState>;
          activeDeviceId?: string;
        };
        if (parsed && typeof parsed.devices === 'object') {
          // Clear any stale pending state on cold boot
          const sanitizedDevices: Record<string, DeviceRealtimeState> = {};
          Object.entries(parsed.devices).forEach(([id, dev]) => {
            sanitizedDevices[id] = {
              ...dev,
              pendingRelays: {},
            };
          });

          set({
            devices: sanitizedDevices,
            activeDeviceId: parsed.activeDeviceId || get().activeDeviceId,
            isHydrated: true,
          });
          return;
        }
      }
    } catch (err) {
      console.warn('[Store] Failed to hydrate state from AsyncStorage:', err);
    }
    set({ isHydrated: true });
  },
}));

// Strict Zustand Selectors (following CLAUDE.md permanent rule)
export const selectConnectionState = (state: DeviceStoreState): MqttConnectionState =>
  state.connection;

export const selectActiveDeviceId = (state: DeviceStoreState): string => state.activeDeviceId;

export const selectActiveDevice = (state: DeviceStoreState): DeviceRealtimeState =>
  state.devices[state.activeDeviceId] || createDefaultDeviceState(state.activeDeviceId);

export const selectActiveDeviceName = (state: DeviceStoreState): string => {
  const dev = state.devices[state.activeDeviceId];
  return dev ? dev.name : 'Suraxa Controller';
};

export const selectActiveDeviceStatus = (state: DeviceStoreState): StatusPayload => {
  const dev = state.devices[state.activeDeviceId];
  return dev ? dev.status : 'offline';
};

export const selectActiveStatus = selectActiveDeviceStatus;

export const selectActiveTelemetry = (state: DeviceStoreState): TelemetryPayload | null => {
  const dev = state.devices[state.activeDeviceId];
  return dev ? dev.telemetry : null;
};

export const selectActiveRelays = (state: DeviceStoreState): number[] => {
  const dev = state.devices[state.activeDeviceId];
  return dev ? dev.relays : [0, 0, 0, 0, 0, 0, 0, 0];
};

export const selectActivePendingRelays = (state: DeviceStoreState): Record<number, boolean> => {
  const dev = state.devices[state.activeDeviceId];
  return dev ? dev.pendingRelays : {};
};

export const selectActiveLeds = (state: DeviceStoreState): LedStripState[] => {
  const dev = state.devices[state.activeDeviceId];
  return dev
    ? dev.leds
    : [
        { on: 0, br: 50, rgb: [0, 255, 128], fx: 0 },
        { on: 0, br: 50, rgb: [0, 128, 255], fx: 0 },
      ];
};

export const selectActiveFault = (state: DeviceStoreState): string | null => {
  const dev = state.devices[state.activeDeviceId];
  return dev ? dev.fault : null;
};

export const selectActiveLastUpdated = (state: DeviceStoreState): number | null => {
  const dev = state.devices[state.activeDeviceId];
  return dev ? dev.lastUpdated : null;
};

export const selectActiveError = (state: DeviceStoreState): string | null => {
  const dev = state.devices[state.activeDeviceId];
  return dev ? dev.error : null;
};

export const selectIsHydrated = (state: DeviceStoreState): boolean => state.isHydrated;
