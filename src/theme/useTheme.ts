import { useColorScheme } from 'react-native';
import { AppTheme, darkTheme, lightTheme } from './index';

export function useTheme(): AppTheme {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkTheme : lightTheme;
}
