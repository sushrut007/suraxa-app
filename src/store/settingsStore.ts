import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { TemperatureUnit } from '../utils/formatters';

export const ASYNC_STORAGE_SETTINGS_KEY = '@suraxa_settings_v1';

export interface SettingsStoreState {
  temperatureUnit: TemperatureUnit;
  isHydrated: boolean;
  setTemperatureUnit: (unit: TemperatureUnit) => void;
  toggleTemperatureUnit: () => void;
  hydrateSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  temperatureUnit: 'C',
  isHydrated: false,

  setTemperatureUnit: (unit) => {
    set({ temperatureUnit: unit });
    AsyncStorage.setItem(
      ASYNC_STORAGE_SETTINGS_KEY,
      JSON.stringify({ temperatureUnit: unit })
    ).catch((err) => {
      console.warn('[SettingsStore] Failed to persist settings:', err);
    });
  },

  toggleTemperatureUnit: () => {
    const current = get().temperatureUnit;
    const next: TemperatureUnit = current === 'C' ? 'F' : 'C';
    get().setTemperatureUnit(next);
  },

  hydrateSettings: async () => {
    try {
      const stored = await AsyncStorage.getItem(ASYNC_STORAGE_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { temperatureUnit?: TemperatureUnit };
        if (parsed?.temperatureUnit === 'C' || parsed?.temperatureUnit === 'F') {
          set({ temperatureUnit: parsed.temperatureUnit, isHydrated: true });
          return;
        }
      }
    } catch (err) {
      console.warn('[SettingsStore] Failed to hydrate settings:', err);
    }
    set({ isHydrated: true });
  },
}));

// Strict Zustand Selectors (following CLAUDE.md permanent rule)
export const selectTemperatureUnit = (state: SettingsStoreState): TemperatureUnit =>
  state.temperatureUnit;

export const selectToggleTemperatureUnit = (state: SettingsStoreState): (() => void) =>
  state.toggleTemperatureUnit;
