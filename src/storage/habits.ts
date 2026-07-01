import AsyncStorage from '@react-native-async-storage/async-storage';

import { Habit } from '../types';

const HABITS_KEY = '@habits';

export async function loadHabits(): Promise<Habit[]> {
  try {
    const raw = await AsyncStorage.getItem(HABITS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Habit[]) : [];
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
