import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { parseTime } from '../utils/date';

const ANDROID_CHANNEL_ID = 'habit-reminders';

// Show reminders as banners even when the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Ask for permission and (on Android) create the reminders channel.
// Returns true when notifications are allowed.
export async function ensureNotificationSetup(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Habit Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C5CE7',
    });
  }

  const settings = await Notifications.getPermissionsAsync();
  let granted =
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  if (!granted) {
    const request = await Notifications.requestPermissionsAsync();
    granted =
      request.granted ||
      request.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  }

  return granted;
}

// Schedule a daily repeating reminder at "HH:mm". Returns the notification id,
// or null if permission was denied or the time was invalid.
export async function scheduleReminder(
  habitName: string,
  time: string | null
): Promise<string | null> {
  const parsed = parseTime(time);
  if (!parsed) return null;

  const granted = await ensureNotificationSetup();
  if (!granted) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ Habit reminder',
      body: `Time to complete: ${habitName}`,
    },
    trigger: {
      hour: parsed.hour,
      minute: parsed.minute,
      repeats: true,
      channelId: ANDROID_CHANNEL_ID,
    },
  });

  return id;
}

// Cancel a previously scheduled reminder. Safe to call with null/unknown ids.
export async function cancelReminder(notificationId: string | null): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (e) {
    console.warn('Failed to cancel reminder', e);
  }
}

// Cancel the old reminder (if any) and schedule a new one when enabled.
export async function syncReminder(
  previousId: string | null,
  enabled: boolean,
  habitName: string,
  time: string | null
): Promise<string | null> {
  await cancelReminder(previousId);
  if (!enabled) return null;
  return scheduleReminder(habitName, time);
}
