const timeFmt = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatEventTime(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : timeFmt.format(d);
}

export function formatEventRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "—";

  const sameDay = start.toDateString() === end.toDateString();
  return sameDay
    ? `${timeFmt.format(start)} – ${timeFmt.format(end)}`
    : `${timeFmt.format(start)} – ${timeFmt.format(end)} (+1d)`;
}

export function isWithinEvent(
  daytotest: Date,
  startIso: string,
  endIso: string,
): boolean {
  const t = daytotest.getTime();
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  if (isNaN(t) || isNaN(start) || isNaN(end)) return false;
  return t >= start && t <= end;
}

export interface CalendarCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getCalendarDays(year: number, month: number): CalendarCell[] {
  const today = new Date();
  const firstDay = new Date(year, month, 1);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells: CalendarCell[] = [];

  for (let i = startDayOfWeek - 1; i >= 0; --i) {
    const date = new Date(year, month - 1, prevMonthDays - i);
    cells.push({ date, isCurrentMonth: false, isToday: false });
  }

  for (let d = 1; d <= daysInMonth; ++d) {
    const date = new Date(year, month, d);
    const isToday = date.toDateString() === today.toDateString();
    cells.push({ date, isCurrentMonth: true, isToday });
  }

  const remaining_cells = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= remaining_cells; ++i) {
    const date = new Date(year, month + 1, i);
    cells.push({ date, isCurrentMonth: false, isToday: false });
  }

  return cells;
}
