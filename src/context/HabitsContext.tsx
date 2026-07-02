import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react';
import * as Notifications from 'expo-notifications';

import { Habit, Completions } from '../types';
import {
  loadHabits,
  upsertHabit as upsertHabitStore,
  deleteHabit as deleteHabitStore,
} from '../storage/habits';
import {
  loadCompletions,
  toggleCompletion as toggleCompletionStore,
  setReminderDone as setReminderDoneStore,
  removeHabitCompletions,
} from '../storage/completions';
import {
  syncHabitReminders,
  cancelHabitReminders,
  ACTION_SKIP,
} from '../notifications/reminders';
import { todayKey } from '../utils/date';

type HabitsContextValue = {
  habits: Habit[];
  completions: Completions;
  loading: boolean;
  saveHabit: (habit: Habit) => Promise<void>;
  removeHabit: (habit: Habit) => Promise<void>;
  toggle: (habitId: string, day: string) => Promise<void>;
  markReminder: (
    habitId: string,
    reminderId: string,
    done: boolean,
    day?: string
  ) => Promise<void>;
  getHabit: (id: string) => Habit | undefined;
};

const HabitsContext = createContext<HabitsContextValue | undefined>(undefined);

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completions>({});
  const [loading, setLoading] = useState(true);

  // Keep a ref so the notification listener always sees the latest habits.
  const habitsRef = useRef<Habit[]>([]);
  habitsRef.current = habits;

  useEffect(() => {
    (async () => {
      const [h, c] = await Promise.all([loadHabits(), loadCompletions()]);
      setHabits(h);
      setCompletions(c);
      setLoading(false);
    })();
  }, []);

  const markReminder = useCallback(
    async (habitId: string, reminderId: string, done: boolean, day?: string) => {
      const habit = habitsRef.current.find((h) => h.id === habitId);
      const allIds = habit ? habit.reminders.map((r) => r.id) : [reminderId];
      const next = await setReminderDoneStore(
        habitId,
        day ?? todayKey(),
        reminderId,
        done,
        allIds
      );
      setCompletions(next);
    },
    []
  );

  // Handle a notification action/tap: "Done" (or a plain tap) marks the
  // sub-reminder complete for today; "Skip" does nothing.
  const handleResponse = useCallback(
    async (response: Notifications.NotificationResponse) => {
      if (response.actionIdentifier === ACTION_SKIP) return;
      const data = response.notification.request.content.data as
        | { habitId?: string; reminderId?: string }
        | undefined;
      if (!data?.habitId || !data?.reminderId) return;
      await markReminder(data.habitId, data.reminderId, true);
    },
    [markReminder]
  );

  // Live: respond to notification actions while the app is running.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => sub.remove();
  }, [handleResponse]);

  // Cold start: process the notification the app was opened from — but only
  // after habits have loaded, so the "all sub-reminders done" check is correct.
  useEffect(() => {
    if (loading) return;
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleResponse(response);
    });
  }, [loading, handleResponse]);

  const saveHabit = useCallback(async (habit: Habit) => {
    const previous = habitsRef.current.find((h) => h.id === habit.id);
    const reminders = await syncHabitReminders(previous, habit);
    const next = await upsertHabitStore({ ...habit, reminders });
    setHabits(next);
  }, []);

  const removeHabit = useCallback(async (habit: Habit) => {
    await cancelHabitReminders(habit);
    const nextHabits = await deleteHabitStore(habit.id);
    const nextCompletions = await removeHabitCompletions(habit.id);
    setHabits(nextHabits);
    setCompletions(nextCompletions);
  }, []);

  const toggle = useCallback(async (habitId: string, day: string) => {
    const next = await toggleCompletionStore(habitId, day);
    setCompletions(next);
  }, []);

  const getHabit = useCallback(
    (id: string) => habits.find((h) => h.id === id),
    [habits]
  );

  const value = useMemo(
    () => ({
      habits,
      completions,
      loading,
      saveHabit,
      removeHabit,
      toggle,
      markReminder,
      getHabit,
    }),
    [habits, completions, loading, saveHabit, removeHabit, toggle, markReminder, getHabit]
  );

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>;
}

export function useHabits(): HabitsContextValue {
  const ctx = useContext(HabitsContext);
  if (!ctx) throw new Error('useHabits must be used within a HabitsProvider');
  return ctx;
}
