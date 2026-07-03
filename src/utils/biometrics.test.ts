import * as LocalAuthentication from 'expo-local-authentication';
import { isBiometricAvailable, promptBiometric } from './biometrics';

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));

describe('isBiometricAvailable', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns true when hardware exists and biometrics are enrolled', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);

    expect(await isBiometricAvailable()).toBe(true);
  });

  it('returns false when there is no hardware', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);

    expect(await isBiometricAvailable()).toBe(false);
  });

  it('returns false when hardware exists but nothing is enrolled', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);

    expect(await isBiometricAvailable()).toBe(false);
  });
});

describe('promptBiometric', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns true on a successful prompt', async () => {
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });

    expect(await promptBiometric()).toBe(true);
  });

  it('returns false when the prompt fails or is cancelled', async () => {
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: false });

    expect(await promptBiometric()).toBe(false);
  });

  it('does not disable the device passcode fallback', async () => {
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });

    await promptBiometric();

    const options = (LocalAuthentication.authenticateAsync as jest.Mock).mock.calls[0][0];
    expect(options.disableDeviceFallback).not.toBe(true);
  });
});
