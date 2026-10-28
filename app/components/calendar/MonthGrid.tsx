import { DayCell } from "./DayCell";
import { getCalendarDays, isWithinEvent } from "@/lib/calendar-utils";
import { WEEKDAYS } from "@/lib/calendar-utils";
import type { calendarEvent } from "@/types/calendar";

export function MonthGrid({ date, events }: { date: Date, events: calendarEvent[] }) {
  const cells = getCalendarDays(date.getFullYear(), date.getMonth());

  return (
    <div className="grid grid-cols-7 border-t border-l border-border rounded-lg overflow-hidden">
      {WEEKDAYS.map((day) => (
        <div key={day} className="border-r border-b border-border p-3 text-center text-[0.8rem] font-semibold">{day}</div>
      ))}
      {cells.map((cell) => {
        const today = cell.date;
        const dayEvents = events.filter((e) => isWithinEvent(today, e.startTimestampnz, e.endTimestampnz));
        return (
          <DayCell key={today.getTime()} events={dayEvents} daycell={cell} />
        );
      })}
    </div>
  );
}
