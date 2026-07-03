import * as LocalAuthentication from 'expo-local-authentication';

export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
}

// Leaves disableDeviceFallback at its default (false) so a bad fingerprint
// read falls back to the device passcode instead of locking the user out.
export async function promptBiometric(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock Home Owners Hub',
    fallbackLabel: 'Use passcode',
  });
  return result.success;
}
