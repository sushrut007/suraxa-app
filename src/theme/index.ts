import { ColorPalette, darkColors, lightColors } from './colors';
import { borderRadius, BorderRadius, spacing, Spacing, touchTarget } from './spacing';
import { typography, Typography } from './typography';

export interface AppTheme {
  isDark: boolean;
  colors: ColorPalette;
  spacing: Spacing;
  borderRadius: BorderRadius;
  typography: Typography;
  touchTarget: typeof touchTarget;
}

export const lightTheme: AppTheme = {
  isDark: false,
  colors: lightColors,
  spacing,
  borderRadius,
  typography,
  touchTarget,
};

export const darkTheme: AppTheme = {
  isDark: true,
  colors: darkColors,
  spacing,
  borderRadius,
  typography,
  touchTarget,
};

export * from './colors';
export * from './spacing';
export * from './typography';
export * from './useTheme';
