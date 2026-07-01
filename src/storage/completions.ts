import AsyncStorage from '@react-native-async-storage/async-storage';

import { Completions } from '../types';

const COMPLETIONS_KEY = '@completions';

export async function loadCompletions(): Promise<Completions> {
  try {
    const raw = await AsyncStorage.getItem(COMPLETIONS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Completions) : {};
  } catch (e) {
    console.warn('Failed to load completions', e);
    return {};
  }
}

export async function saveCompletions(data: Completions): Promise<void> {
  try {
    await AsyncStorage.setItem(COMPLETIONS_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save completions', e);
  }
}

export function isDone(data: Completions, habitId: string, day: string): boolean {
  return Boolean(data[habitId] && data[habitId][day]);
}

// Toggle one habit/day cell and return the updated map (new reference).
export async function toggleCompletion(
  habitId: string,
  day: string
): Promise<Completions> {
  const data = await loadCompletions();
  const forHabit = { ...(data[habitId] || {}) };
  if (forHabit[day]) {
    delete forHabit[day];
  } else {
    forHabit[day] = true;
  }
  const next: Completions = { ...data, [habitId]: forHabit };
  await saveCompletions(next);
  return next;
}

// Remove all completion history for a deleted habit.
export async function removeHabitCompletions(habitId: string): Promise<Completions> {
  const data = await loadCompletions();
  if (!data[habitId]) return data;
  const next = { ...data };
  delete next[habitId];
  await saveCompletions(next);
  return next;
}
