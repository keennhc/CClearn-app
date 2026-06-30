import { ExpoConfig, ConfigContext } from 'expo/config';
import packageJson from './package.json';

const version = packageJson.version;
const [major, minor, patch] = version.split('.').map(Number);
const semverCode = major * 10000 + minor * 100 + patch;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Home Owners Hub',
  slug: 'home-owners-hub',
  version,
  ios: {
    ...config.ios,
    supportsTablet: true,
    // BUILD_NUMBER env var overrides for EAS; falls back to semver string
    buildNumber: process.env.BUILD_NUMBER ?? version,
  },
  android: {
    ...config.android,
    // BUILD_NUMBER env var overrides for EAS; falls back to semver-derived integer
    versionCode: process.env.BUILD_NUMBER ? parseInt(process.env.BUILD_NUMBER, 10) : semverCode,
  },
  extra: {
    apiUrl: process.env.API_URL || 'http://localhost:3000',
    eas: {
      projectId: 'f5465d1d-2941-4071-bf9c-a2390412f54c',
    },
  },
  owner: 'keennwebs-team',
});
