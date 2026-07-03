import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from './ProfileScreen';
import { getPermissionStatus, registerForPushNotifications } from '../../utils/notifications';
import { registerToken } from '../../services/notifications';

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

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}));

describe('ProfileScreen', () => {
  beforeEach(() => jest.clearAllMocks());

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
});
