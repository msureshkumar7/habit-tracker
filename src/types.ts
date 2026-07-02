// A single timed sub-reminder within a habit (e.g. "500 ml" at 09:00).
export type Reminder = {
  id: string;
  time: string; // "HH:mm" (24h)
  label: string; // optional detail, e.g. "500 ml" / "Glass 2"
  notificationId: string | null; // scheduled notification id, for cancel/reschedule
};

export type Habit = {
  id: string;
  name: string;
  goal: string; // daily goal, e.g. "2 L water"
  remarks: string; // "Remarks" column from the PDF tracker
  color: string; // accent color used in list + grid
  sound: string; // built-in sound key: "default" | "chime" | "bell" | "calm"
  reminderEnabled: boolean;
  reminders: Reminder[]; // one or more sub-reminders across the day
  createdAt: number;

  // Legacy fields kept optional so old saved habits still parse and migrate.
  reminderTime?: string | null;
  notificationId?: string | null;
};

// Per-day progress for a habit: which sub-reminders were answered "Done", and
// whether the day counts as complete (auto when all reminders done, or manual).
export type DayProgress = {
  reminders: Record<string, boolean>; // reminderId -> done
  done: boolean; // grid/Today cell state
};

// completions[habitId][YYYY-MM-DD] -> DayProgress
export type Completions = Record<string, Record<string, DayProgress>>;

// Built-in reminder sounds offered in the habit editor. `file` is the bundled
// asset name (Android channel + iOS sound); `default` uses the system sound.
export type SoundOption = { key: string; label: string; file: string | null };

export const SOUND_OPTIONS: SoundOption[] = [
  { key: 'default', label: 'Default', file: null },
  { key: 'chime', label: 'Chime', file: 'chime.wav' },
  { key: 'bell', label: 'Bell', file: 'bell.wav' },
  { key: 'calm', label: 'Calm', file: 'calm.wav' },
];
