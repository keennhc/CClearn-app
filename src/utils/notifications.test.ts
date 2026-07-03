import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { registerForPushNotifications, getPermissionStatus } from './notifications';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
}));

jest.mock('expo-device', () => ({
  isDevice: true,
}));

describe('registerForPushNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Device as { isDevice: boolean }).isDevice = true;
  });

  it('returns null when not a physical device', async () => {
    (Device as { isDevice: boolean }).isDevice = false;

    const result = await registerForPushNotifications();

    expect(result).toBeNull();
  });

  it('requests permission when not already granted, and returns the token on success', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: 'ExponentPushToken[abc]' });

    const result = await registerForPushNotifications();

    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    expect(result).toEqual({ token: 'ExponentPushToken[abc]', platform: expect.any(String) });
  });

  it('returns null when permission is denied', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

    const result = await registerForPushNotifications();

    expect(result).toBeNull();
    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it('does not re-request permission when already granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: 'ExponentPushToken[abc]' });

    await registerForPushNotifications();

    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });
});

describe('getPermissionStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Device as { isDevice: boolean }).isDevice = true;
  });

  it('returns null when not a physical device', async () => {
    (Device as { isDevice: boolean }).isDevice = false;

    expect(await getPermissionStatus()).toBeNull();
  });

  it('returns the current permission status', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

    expect(await getPermissionStatus()).toBe('granted');
  });
});
