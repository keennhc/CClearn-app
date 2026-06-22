import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Home Owners Hub',
  slug: 'home-owners-hub',
  extra: {
    apiUrl: process.env.API_URL || 'http://localhost:3000',
  },
});
