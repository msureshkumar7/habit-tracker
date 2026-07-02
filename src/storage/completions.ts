import AsyncStorage from '@react-native-async-storage/async-storage';

import { Completions, DayProgress } from '../types';

const COMPLETIONS_KEY = '@completions';

function emptyProgress(): DayProgress {
  return { reminders: {}, done: false };
}

// Migrate the old shape (day -> boolean) to the new shape (day -> DayProgress).
function normalizeCompletions(raw: unknown): Completions {
  if (!raw || typeof raw !== 'object') return {};
  const out: Completions = {};
  for (const [habitId, days] of Object.entries(raw as Record<string, unknown>)) {
    if (!days || typeof days !== 'object') continue;
    out[habitId] = {};
    for (const [day, value] of Object.entries(days as Record<string, unknown>)) {
      if (typeof value === 'boolean') {
        out[habitId][day] = { reminders: {}, done: value };
      } else if (value && typeof value === 'object') {
        const v = value as Partial<DayProgress>;
        out[habitId][day] = {
          reminders: v.reminders && typeof v.reminders === 'object' ? v.reminders : {},
          done: Boolean(v.done),
        };
      }
    }
  }
  return out;
}

export async function loadCompletions(): Promise<Completions> {
  try {
    const raw = await AsyncStorage.getItem(COMPLETIONS_KEY);
    if (!raw) return {};
    return normalizeCompletions(JSON.parse(raw));
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

export function getDayProgress(
  data: Completions,
  habitId: string,
  day: string
): DayProgress {
  return data[habitId]?.[day] ?? emptyProgress();
}

export function isDone(data: Completions, habitId: string, day: string): boolean {
  return Boolean(data[habitId]?.[day]?.done);
}

// Count how many of the given reminders are marked done for the day.
export function doneReminderCount(
  data: Completions,
  habitId: string,
  day: string,
  reminderIds: string[]
): number {
  const flags = data[habitId]?.[day]?.reminders ?? {};
  return reminderIds.reduce((n, id) => (flags[id] ? n + 1 : n), 0);
}

// Manual override toggle for the whole day (used by Today/Month tap).
export async function toggleCompletion(
  habitId: string,
  day: string
): Promise<Completions> {
  const data = await loadCompletions();
  const current = data[habitId]?.[day] ?? emptyProgress();
  const nextDone = !current.done;
  const next: Completions = {
    ...data,
    [habitId]: {
      ...(data[habitId] || {}),
      [day]: { reminders: { ...current.reminders }, done: nextDone },
    },
  };
  await saveCompletions(next);
  return next;
}

// Mark a single sub-reminder done/undone and recompute the day's `done` flag:
// the day auto-completes when every reminder in `allReminderIds` is done.
export async function setReminderDone(
  habitId: string,
  day: string,
  reminderId: string,
  done: boolean,
  allReminderIds: string[]
): Promise<Completions> {
  const data = await loadCompletions();
  const current = data[habitId]?.[day] ?? emptyProgress();
  const reminders = { ...current.reminders };
  if (done) {
    reminders[reminderId] = true;
  } else {
    delete reminders[reminderId];
  }
  // The day is complete when every sub-reminder is done; undoing one un-marks it.
  const nextDone =
    allReminderIds.length > 0 && allReminderIds.every((id) => reminders[id]);
  const next: Completions = {
    ...data,
    [habitId]: {
      ...(data[habitId] || {}),
      [day]: { reminders, done: nextDone },
    },
  };
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
