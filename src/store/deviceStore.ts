import { create } from 'zustand';

export type DeviceConnectionStatus = 'online' | 'offline' | 'fault';

export interface DeviceInfo {
  id: string;
  name: string;
  status: DeviceConnectionStatus;
  faultReason?: string | null;
  lastSeen?: number;
}

export interface DeviceStoreState {
  activeDevice: DeviceInfo | null;
  devices: DeviceInfo[];
  setActiveDevice: (device: DeviceInfo | null) => void;
  updateDeviceStatus: (
    id: string,
    status: DeviceConnectionStatus,
    faultReason?: string | null
  ) => void;
  setDevices: (devices: DeviceInfo[]) => void;
}

export const useDeviceStore = create<DeviceStoreState>((set) => ({
  activeDevice: {
    id: 'DEV-SURAXA-01',
    name: 'Suraxa Unit 01 (ICU Cleanroom)',
    status: 'online',
    faultReason: null,
    lastSeen: Date.now(),
  },
  devices: [
    {
      id: 'DEV-SURAXA-01',
      name: 'Suraxa Unit 01 (ICU Cleanroom)',
      status: 'online',
      faultReason: null,
      lastSeen: Date.now(),
    },
  ],
  setActiveDevice: (device) => set({ activeDevice: device }),
  updateDeviceStatus: (id, status, faultReason = null) =>
    set((state) => {
      const updatedDevices = state.devices.map((d) =>
        d.id === id ? { ...d, status, faultReason, lastSeen: Date.now() } : d
      );
      const updatedActive =
        state.activeDevice?.id === id
          ? { ...state.activeDevice, status, faultReason, lastSeen: Date.now() }
          : state.activeDevice;
      return { devices: updatedDevices, activeDevice: updatedActive };
    }),
  setDevices: (devices) => set({ devices }),
}));

// Strict Zustand Selectors (following CLAUDE.md permanent rule)
export const selectActiveDevice = (state: DeviceStoreState): DeviceInfo | null =>
  state.activeDevice;

export const selectActiveDeviceName = (state: DeviceStoreState): string =>
  state.activeDevice ? state.activeDevice.name : 'No Active Device';

export const selectActiveDeviceId = (state: DeviceStoreState): string | null =>
  state.activeDevice ? state.activeDevice.id : null;

export const selectActiveDeviceStatus = (state: DeviceStoreState): DeviceConnectionStatus =>
  state.activeDevice ? state.activeDevice.status : 'offline';

export const selectActiveDeviceFault = (state: DeviceStoreState): string | null =>
  state.activeDevice?.faultReason ?? null;

export const selectDevicesList = (state: DeviceStoreState): DeviceInfo[] => state.devices;
