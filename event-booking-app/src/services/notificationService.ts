import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions, configure the Android channel,
 * and obtain the device's FCM push token.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#208AEF',
        sound: 'default',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[FCM] Notification permissions not granted');
      return null;
    }

    // Get the device FCM push token (native FCM token for Firebase Console & Spring Boot FCM v1)
    const tokenData = await Notifications.getDevicePushTokenAsync();
    console.log('[FCM] Device Push Token:', tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.error('[FCM] Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Register device FCM token with the Spring Boot backend for the logged-in user
 */
export async function syncFcmTokenWithBackend(email: string): Promise<boolean> {
  try {
    if (!email) return false;
    const token = await registerForPushNotificationsAsync();
    if (!token) return false;

    const { smartFetch } = await import('../config/apiConfig');
    const response = await smartFetch('/users/fcm-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, fcmToken: token }),
    });

    if (response.ok) {
      console.log('[FCM] Successfully synced token with backend for:', email);
      return true;
    } else {
      console.warn('[FCM] Failed to sync token with backend status:', response.status);
      return false;
    }
  } catch (err) {
    console.error('[FCM] Error syncing token with backend:', err);
    return false;
  }
}

