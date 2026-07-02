import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { Habit, Reminder, SOUND_OPTIONS } from '../types';
import { parseTime } from '../utils/date';

export const HABIT_CATEGORY = 'HABIT_REMINDER';
export const ACTION_DONE = 'MARK_DONE';
export const ACTION_SKIP = 'DISMISS';

// One Android channel per built-in sound (channel sound is fixed at creation).
const channelIdForSound = (soundKey: string) => `habit-reminders-${soundKey}`;

const soundOption = (soundKey: string) =>
  SOUND_OPTIONS.find((s) => s.key === soundKey) ?? SOUND_OPTIONS[0];

// Show reminders as banners even when the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let categoryReady = false;

async function ensureCategory(): Promise<void> {
  if (categoryReady) return;
  await Notifications.setNotificationCategoryAsync(HABIT_CATEGORY, [
    {
      identifier: ACTION_DONE,
      buttonTitle: '✅ Done',
      options: { opensAppToForeground: true },
    },
    {
      identifier: ACTION_SKIP,
      buttonTitle: 'Skip',
      options: { opensAppToForeground: false, isDestructive: true },
    },
  ]);
  categoryReady = true;
}

async function ensureChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  for (const opt of SOUND_OPTIONS) {
    await Notifications.setNotificationChannelAsync(channelIdForSound(opt.key), {
      name: `Habit Reminders (${opt.label})`,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C5CE7',
      sound: opt.file ?? undefined, // undefined = system default sound
    });
  }
}

// Ask for permission and set up channels + the Done/Skip action category.
// Returns true when notifications are allowed.
export async function ensureNotificationSetup(): Promise<boolean> {
  await ensureChannels();
  await ensureCategory();

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

async function scheduleOne(
  habit: Habit,
  reminder: Reminder
): Promise<string | null> {
  const parsed = parseTime(reminder.time);
  if (!parsed) return null;

  const opt = soundOption(habit.sound);
  const body = reminder.label
    ? `${reminder.label}${habit.goal ? ` — ${habit.goal}` : ''}`
    : habit.goal || 'Time to complete this habit';

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `⏰ ${habit.name}`,
      body,
      categoryIdentifier: HABIT_CATEGORY,
      data: { habitId: habit.id, reminderId: reminder.id },
      sound: opt.file ?? undefined, // iOS per-notification sound
    },
    trigger: {
      hour: parsed.hour,
      minute: parsed.minute,
      repeats: true,
      channelId: channelIdForSound(habit.sound),
    },
  });
  return id;
}

// Schedule all of a habit's reminders (when enabled). Returns the reminders
// with fresh notificationIds; returns them unscheduled if permission denied.
export async function scheduleHabitReminders(habit: Habit): Promise<Reminder[]> {
  if (!habit.reminderEnabled || habit.reminders.length === 0) {
    return habit.reminders.map((r) => ({ ...r, notificationId: null }));
  }
  const granted = await ensureNotificationSetup();
  if (!granted) {
    return habit.reminders.map((r) => ({ ...r, notificationId: null }));
  }
  const result: Reminder[] = [];
  for (const r of habit.reminders) {
    const notificationId = await scheduleOne(habit, r);
    result.push({ ...r, notificationId });
  }
  return result;
}

export async function cancelReminder(notificationId: string | null): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (e) {
    console.warn('Failed to cancel reminder', e);
  }
}

// Cancel every scheduled notification belonging to a habit.
export async function cancelHabitReminders(habit: Habit): Promise<void> {
  for (const r of habit.reminders) {
    await cancelReminder(r.notificationId);
  }
}

// Cancel a habit's previous reminders and (re)schedule the current ones.
// Returns the new reminders array (with notificationIds) to persist.
export async function syncHabitReminders(
  previous: Habit | undefined,
  next: Habit
): Promise<Reminder[]> {
  if (previous) await cancelHabitReminders(previous);
  return scheduleHabitReminders(next);
}

// Fire a one-off notification a couple seconds out so the user can preview the
// chosen sound while editing a habit.
export async function previewSound(soundKey: string): Promise<boolean> {
  const granted = await ensureNotificationSetup();
  if (!granted) return false;
  const opt = soundOption(soundKey);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 Sound preview',
      body: `This is the "${opt.label}" reminder sound`,
      sound: opt.file ?? undefined,
    },
    trigger: {
      seconds: 2,
      channelId: channelIdForSound(soundKey),
    },
  });
  return true;
}
