import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { userApi } from '../api';

// Show alerts + play sound when a notification arrives while the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions, obtain the FCM token,
 * and register it with the backend.
 *
 * Never throws — all errors are swallowed so a denied permission
 * or network failure never crashes the app.
 */
export async function registerForPushNotifications(): Promise<void> {
  try {
    // 1. Check / request permission
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;

    if (existing !== 'granted') {
      const { status: asked } = await Notifications.requestPermissionsAsync();
      status = asked;
    }

    if (status !== 'granted') return; // user denied — silently skip

    // 2. Get the native device token (FCM on Android, APNs-backed on iOS)
    const { data: token } = await Notifications.getDevicePushTokenAsync();
    if (!token) return;

    // 3. Register with our backend (fire-and-forget)
    userApi.registerDeviceToken(token, Platform.OS).catch(() => {});
  } catch {
    // Never crash the app on notification setup failure
  }
}
