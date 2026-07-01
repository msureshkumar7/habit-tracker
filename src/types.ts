export type Habit = {
  id: string;
  name: string;
  goal: string; // "Goals" column from the PDF tracker
  remarks: string; // "Remarks" column from the PDF tracker
  color: string; // accent color used in list + grid
  reminderEnabled: boolean;
  reminderTime: string | null; // "HH:mm" (24h)
  notificationId: string | null; // scheduled notification id, for cancel/reschedule
  createdAt: number;
};

// completions[habitId][YYYY-MM-DD] === true means the habit was done that day.
export type Completions = Record<string, Record<string, boolean>>;
