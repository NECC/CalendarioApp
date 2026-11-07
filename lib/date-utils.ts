export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Key for grouping events by day. */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Day to select when changing month: today in the current month, otherwise the 1st. */
export function defaultSelectedDate(month: Date, today = new Date()): Date {
  return month.getFullYear() === today.getFullYear() &&
    month.getMonth() === today.getMonth()
    ? new Date(today.getFullYear(), today.getMonth(), today.getDate())
    : new Date(month.getFullYear(), month.getMonth(), 1);
}
