export interface ColorPalette {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryContrast: string;

  danger: string; // UV-C Hazard and Fault indicator
  dangerLight: string;
  dangerDark: string;
  dangerContrast: string;

  warning: string; // Interlock standby and cautious operational alerts
  warningLight: string;
  warningDark: string;
  warningContrast: string;

  success: string; // Device Online / Clean cycle active
  successLight: string;
  successDark: string;
  successContrast: string;

  offline: string; // Disconnected / Standby neutral
  offlineLight: string;
  offlineDark: string;

  background: string;
  backgroundSecondary: string;
  card: string;
  cardBorder: string;
  cardElevated: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  divider: string;
  ripple: string;
}

export const lightColors: ColorPalette = {
  primary: '#0891B2', // Medical Cyan/Teal 600
  primaryLight: '#E0F2FE', // Cyan/Sky 100
  primaryDark: '#0E7490', // Cyan 700
  primaryContrast: '#FFFFFF',

  danger: '#DC2626', // Clinical Hazard Red 600 (UV-C & Fault)
  dangerLight: '#FEE2E2', // Red 100
  dangerDark: '#991B1B', // Red 800
  dangerContrast: '#FFFFFF',

  warning: '#D97706', // Amber 600
  warningLight: '#FEF3C7', // Amber 100
  warningDark: '#92400E', // Amber 800
  warningContrast: '#FFFFFF',

  success: '#059669', // Emerald 600
  successLight: '#D1FAE5', // Emerald 100
  successDark: '#065F46', // Emerald 800
  successContrast: '#FFFFFF',

  offline: '#64748B', // Slate 500
  offlineLight: '#F1F5F9', // Slate 100
  offlineDark: '#334155', // Slate 700

  background: '#F8FAFC', // Slate 50 (clinical, sterile clean)
  backgroundSecondary: '#F1F5F9', // Slate 100
  card: '#FFFFFF',
  cardBorder: '#E2E8F0', // Slate 200
  cardElevated: '#FFFFFF',

  textPrimary: '#0F172A', // Slate 900
  textSecondary: '#475569', // Slate 600
  textMuted: '#94A3B8', // Slate 400
  textInverse: '#FFFFFF',

  divider: '#E2E8F0',
  ripple: 'rgba(8, 145, 178, 0.12)',
};

export const darkColors: ColorPalette = {
  primary: '#22D3EE', // Vivid Medical Cyan 400
  primaryLight: '#164E63', // Cyan 900
  primaryDark: '#0891B2', // Cyan 600
  primaryContrast: '#082F49',

  danger: '#F87171', // Bright Alert Red 400
  dangerLight: '#450A0A', // Red 950
  dangerDark: '#DC2626', // Red 600
  dangerContrast: '#450A0A',

  warning: '#FBBF24', // Amber 400
  warningLight: '#451A03', // Amber 950
  warningDark: '#D97706', // Amber 600
  warningContrast: '#451A03',

  success: '#34D399', // Emerald 400
  successLight: '#064E3B', // Emerald 900
  successDark: '#059669', // Emerald 600
  successContrast: '#022C22',

  offline: '#94A3B8', // Slate 400
  offlineLight: '#1E293B', // Slate 800
  offlineDark: '#0F172A', // Slate 900

  background: '#0B1320', // Deep Clinical Navy/Slate 950
  backgroundSecondary: '#111C2E',
  card: '#16233B', // Subdued Dark Medical Slate
  cardBorder: '#233550',
  cardElevated: '#1D2E4C',

  textPrimary: '#F8FAFC', // Slate 50
  textSecondary: '#94A3B8', // Slate 400
  textMuted: '#64748B', // Slate 500
  textInverse: '#0F172A',

  divider: '#1E293B',
  ripple: 'rgba(34, 211, 238, 0.16)',
};
