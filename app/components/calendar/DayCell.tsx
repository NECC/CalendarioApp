import { EventChip } from "./EventChip";
import type { calendarEvent } from "@/types/calendar";
import type { CalendarCell } from "@/lib/calendar-utils";
import clsx from "clsx";

interface DayCellProps {
  events: calendarEvent[];
  daycell: CalendarCell;
}

export function DayCell({ events, daycell }: DayCellProps) {
  const dayNumber = daycell.date.getDate();

  const cellClass = clsx(
    "border-r border-b border-border min-h-[120px] p-2 relative flex flex-col items-stretch justify-start gap-[0.35rem]",
    !daycell.isCurrentMonth && "opacity-35",
    daycell.isToday && "shadow-[inset_0_0_0_1.5px_var(--accent)] z-10",
  );

  return (
    <div className={cellClass}>
      <div className="flex items-center justify-start">
        <span className="text-[0.85rem] font-medium">{dayNumber}</span>
      </div>
      {events.map((event) => (
        <EventChip key={event.id} event={event} />
      ))}
    </div>
  );
}
