import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export interface PushRegistration {
  token: string;
  platform: 'ios' | 'android';
}

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Requests permission and returns an Expo push token, or null if permission
// was denied or this isn't a physical device (push tokens don't work in
// simulators/on web).
export async function registerForPushNotifications(): Promise<PushRegistration | null> {
  if (!Device.isDevice) return null;
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const { data: token } = await Notifications.getExpoPushTokenAsync();
  return { token, platform: Platform.OS };
}

export async function getPermissionStatus(): Promise<Notifications.PermissionStatus | null> {
  if (!Device.isDevice) return null;
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}
