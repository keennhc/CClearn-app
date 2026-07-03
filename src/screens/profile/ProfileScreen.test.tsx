import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ProfileScreen from './ProfileScreen';
import { getPermissionStatus, registerForPushNotifications } from '../../utils/notifications';
import { registerToken } from '../../services/notifications';
import { isBiometricAvailable, promptBiometric } from '../../utils/biometrics';
import { biometricPreference } from '../../utils/storage';

const mockLogout = jest.fn();
const mockUser = {
  id: 'u1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@test.com',
  role: 'USER' as const,
  communities: [
    { id: 'cm1', communityId: 'c1', communityName: 'Sunset HOA', role: 'COMMUNITY_ADMIN' as const },
    { id: 'cm2', communityId: 'c2', communityName: 'Oak Park', role: 'COMMUNITY_MEMBER' as const },
  ],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
  }),
}));

jest.mock('../../services/upload', () => ({
  uploadFile: jest.fn(),
}));

jest.mock('../../services/notifications', () => ({
  registerToken: jest.fn(),
}));

jest.mock('../../utils/notifications', () => ({
  registerForPushNotifications: jest.fn(),
  getPermissionStatus: jest.fn().mockResolvedValue('denied'),
}));

jest.mock('../../utils/biometrics', () => ({
  isBiometricAvailable: jest.fn().mockResolvedValue(false),
  promptBiometric: jest.fn(),
}));

jest.mock('../../utils/storage', () => ({
  biometricPreference: { get: jest.fn().mockResolvedValue(false), set: jest.fn() },
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}));

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isBiometricAvailable as jest.Mock).mockResolvedValue(false);
    (biometricPreference.get as jest.Mock).mockResolvedValue(false);
  });

  it('renders user name and email', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('john@test.com')).toBeTruthy();
  });

  it('renders community list with roles', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Sunset HOA')).toBeTruthy();
    expect(getByText('Oak Park')).toBeTruthy();
  });

  it('calls logout when sign out button is pressed', () => {
    const { getByText } = render(<ProfileScreen />);
    fireEvent.press(getByText('Sign Out'));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('renders change photo button', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Change Photo')).toBeTruthy();
  });

  it('renders the push notifications row reflecting current permission status', async () => {
    (getPermissionStatus as jest.Mock).mockResolvedValue('granted');

    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => expect(getPermissionStatus).toHaveBeenCalled());
    expect(getByText('Push Notifications')).toBeTruthy();
  });

  it('registers a push token when enabling notifications succeeds', async () => {
    (getPermissionStatus as jest.Mock).mockResolvedValueOnce('denied').mockResolvedValueOnce('granted');
    (registerForPushNotifications as jest.Mock).mockResolvedValue({ token: 'ExponentPushToken[abc]', platform: 'ios' });

    const { getByText, getByTestId } = render(<ProfileScreen />);
    await waitFor(() => expect(getPermissionStatus).toHaveBeenCalledTimes(1));

    fireEvent(getByTestId('push-notifications-switch'), 'onValueChange', true);

    await waitFor(() => expect(registerToken).toHaveBeenCalledWith('ExponentPushToken[abc]', 'ios'));
    expect(getByText('Push Notifications')).toBeTruthy();
  });

  it('hides the biometric toggle when the device has no usable biometric hardware', async () => {
    (isBiometricAvailable as jest.Mock).mockResolvedValue(false);

    const { queryByText } = render(<ProfileScreen />);

    await waitFor(() => expect(isBiometricAvailable).toHaveBeenCalled());
    expect(queryByText('Require Face ID / Touch ID')).toBeNull();
  });

  it('shows the biometric toggle reflecting the stored preference when hardware is available', async () => {
    (isBiometricAvailable as jest.Mock).mockResolvedValue(true);
    (biometricPreference.get as jest.Mock).mockResolvedValue(true);

    const { getByText, getByTestId } = render(<ProfileScreen />);

    await waitFor(() => expect(getByText('Require Face ID / Touch ID')).toBeTruthy());
    expect(getByTestId('biometric-switch').props.value).toBe(true);
  });

  it('enables the biometric lock only after a successful prompt', async () => {
    (isBiometricAvailable as jest.Mock).mockResolvedValue(true);
    (biometricPreference.get as jest.Mock).mockResolvedValue(false);
    (promptBiometric as jest.Mock).mockResolvedValue(true);

    const { getByTestId } = render(<ProfileScreen />);
    await waitFor(() => expect(getByTestId('biometric-switch').props.value).toBe(false));

    fireEvent(getByTestId('biometric-switch'), 'onValueChange', true);

    await waitFor(() => expect(biometricPreference.set).toHaveBeenCalledWith(true));
  });

  it('does not enable the biometric lock when the prompt fails', async () => {
    (isBiometricAvailable as jest.Mock).mockResolvedValue(true);
    (biometricPreference.get as jest.Mock).mockResolvedValue(false);
    (promptBiometric as jest.Mock).mockResolvedValue(false);
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByTestId } = render(<ProfileScreen />);
    await waitFor(() => expect(getByTestId('biometric-switch').props.value).toBe(false));

    fireEvent(getByTestId('biometric-switch'), 'onValueChange', true);

    await waitFor(() => expect(promptBiometric).toHaveBeenCalled());
    expect(biometricPreference.set).not.toHaveBeenCalledWith(true);
    expect(Alert.alert).toHaveBeenCalled();
  });

  it('disables the biometric lock without prompting', async () => {
    (isBiometricAvailable as jest.Mock).mockResolvedValue(true);
    (biometricPreference.get as jest.Mock).mockResolvedValue(true);

    const { getByTestId } = render(<ProfileScreen />);
    await waitFor(() => expect(getByTestId('biometric-switch').props.value).toBe(true));

    fireEvent(getByTestId('biometric-switch'), 'onValueChange', false);

    await waitFor(() => expect(biometricPreference.set).toHaveBeenCalledWith(false));
    expect(promptBiometric).not.toHaveBeenCalled();
  });
});
