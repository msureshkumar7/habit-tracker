import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';

import { Habit, Completions } from '../types';
import {
  loadHabits,
  upsertHabit as upsertHabitStore,
  deleteHabit as deleteHabitStore,
} from '../storage/habits';
import {
  loadCompletions,
  toggleCompletion as toggleCompletionStore,
  removeHabitCompletions,
} from '../storage/completions';
import { cancelReminder } from '../notifications/reminders';

type HabitsContextValue = {
  habits: Habit[];
  completions: Completions;
  loading: boolean;
  saveHabit: (habit: Habit) => Promise<void>;
  removeHabit: (habit: Habit) => Promise<void>;
  toggle: (habitId: string, day: string) => Promise<void>;
  getHabit: (id: string) => Habit | undefined;
};

const HabitsContext = createContext<HabitsContextValue | undefined>(undefined);

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completions>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [h, c] = await Promise.all([loadHabits(), loadCompletions()]);
      setHabits(h);
      setCompletions(c);
      setLoading(false);
    })();
  }, []);

  const saveHabit = useCallback(async (habit: Habit) => {
    const next = await upsertHabitStore(habit);
    setHabits(next);
  }, []);

  const removeHabit = useCallback(async (habit: Habit) => {
    await cancelReminder(habit.notificationId);
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
    () => ({ habits, completions, loading, saveHabit, removeHabit, toggle, getHabit }),
    [habits, completions, loading, saveHabit, removeHabit, toggle, getHabit]
  );

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>;
}

export function useHabits(): HabitsContextValue {
  const ctx = useContext(HabitsContext);
  if (!ctx) throw new Error('useHabits must be used within a HabitsProvider');
  return ctx;
}
