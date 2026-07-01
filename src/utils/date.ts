// Date helpers. All "date keys" are local-time YYYY-MM-DD strings so that a
// habit toggled at 11pm counts for the day the user sees, not UTC.

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

export function daysInMonth(year: number, month0: number): number {
  // month0 is 0-based (0 = January)
  return new Date(year, month0 + 1, 0).getDate();
}

export function monthLabel(year: number, month0: number): string {
  const names = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return `${names[month0]} ${year}`;
}

export function keyForDay(year: number, month0: number, day: number): string {
  return `${year}-${pad2(month0 + 1)}-${pad2(day)}`;
}

// Parse "HH:mm" into { hour, minute }. Returns null when invalid.
export function parseTime(time: string | null): { hour: number; minute: number } | null {
  if (!time) return null;
  const parts = time.split(':');
  if (parts.length !== 2) return null;
  const hour = Number(parts[0]);
  const minute = Number(parts[1]);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return { hour, minute };
}

export function formatTime(time: string | null): string {
  const parsed = parseTime(time);
  if (!parsed) return '';
  const { hour, minute } = parsed;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${pad2(minute)} ${suffix}`;
}
