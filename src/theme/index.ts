import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2196F3',
    primaryContainer: '#BBDEFB',
    secondary: '#FF9800',
    secondaryContainer: '#FFE0B2',
    error: '#F44336',
    errorContainer: '#FFCDD2',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    background: '#FAFAFA',
  },
};

export type AppTheme = typeof theme;
