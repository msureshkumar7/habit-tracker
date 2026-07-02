import AsyncStorage from '@react-native-async-storage/async-storage';

import { Habit, Reminder } from '../types';

const HABITS_KEY = '@habits';

// Bring a stored habit up to the current shape: convert a legacy single
// reminderTime/notificationId into a one-element reminders[] and default sound.
function normalizeHabit(raw: any): Habit {
  const reminders: Reminder[] = Array.isArray(raw?.reminders)
    ? raw.reminders.map((r: any) => ({
        id: String(r?.id ?? newReminderId()),
        time: typeof r?.time === 'string' ? r.time : '09:00',
        label: typeof r?.label === 'string' ? r.label : '',
        notificationId: r?.notificationId ?? null,
      }))
    : raw?.reminderTime
    ? [
        {
          id: newReminderId(),
          time: raw.reminderTime,
          label: '',
          notificationId: raw.notificationId ?? null,
        },
      ]
    : [];

  return {
    id: String(raw?.id ?? newHabitId()),
    name: typeof raw?.name === 'string' ? raw.name : '',
    goal: typeof raw?.goal === 'string' ? raw.goal : '',
    remarks: typeof raw?.remarks === 'string' ? raw.remarks : '',
    color: typeof raw?.color === 'string' ? raw.color : '#6C5CE7',
    sound: typeof raw?.sound === 'string' ? raw.sound : 'default',
    reminderEnabled: Boolean(raw?.reminderEnabled),
    reminders,
    createdAt: typeof raw?.createdAt === 'number' ? raw.createdAt : Date.now(),
  };
}

export async function loadHabits(): Promise<Habit[]> {
  try {
    const raw = await AsyncStorage.getItem(HABITS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeHabit) : [];
  } catch (e) {
    console.warn('Failed to load habits', e);
    return [];
  }
}

export async function saveHabits(habits: Habit[]): Promise<void> {
  try {
    await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  } catch (e) {
    console.warn('Failed to save habits', e);
  }
}

// Insert or replace a habit by id, returning the new list.
export async function upsertHabit(habit: Habit): Promise<Habit[]> {
  const habits = await loadHabits();
  const idx = habits.findIndex((h) => h.id === habit.id);
  if (idx >= 0) {
    habits[idx] = habit;
  } else {
    habits.push(habit);
  }
  await saveHabits(habits);
  return habits;
}

export async function deleteHabit(id: string): Promise<Habit[]> {
  const habits = await loadHabits();
  const next = habits.filter((h) => h.id !== id);
  await saveHabits(next);
  return next;
}

export function newHabitId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function newReminderId(): string {
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
