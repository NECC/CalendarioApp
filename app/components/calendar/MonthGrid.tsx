import { useMemo } from "react";
import { DayCell } from "./DayCell";
import { getCalendarDays, isWithinEvent, WEEKDAYS } from "@/lib/calendar-utils";
import type { calendarEvent } from "@/types/calendar";

export function MonthGrid({
  date,
  events,
}: {
  date: Date;
  events: calendarEvent[];
}) {
  // 1. Memorizar a grelha de dias para não recalcular em cada renderização
  const cells = useMemo(
    () => getCalendarDays(date.getFullYear(), date.getMonth()),
    [date],
  );

  // 2. Pré-processar e agrupar os eventos por dia num mapa O(1)
  const eventsByDay = useMemo(() => {
    const map: Record<number, calendarEvent[]> = {};

    // Inicializar o mapa
    cells.forEach((cell) => {
      map[cell.date.getTime()] = [];
    });

    // Distribuir os eventos pelos dias correspondentes
    events.forEach((event) => {
      cells.forEach((cell) => {
        // Garantimos que passamos as datas convertidas para string (ou como a função espera)
        if (
          isWithinEvent(
            cell.date,
            String(event.startTimestampnz),
            String(event.endTimestampnz),
          )
        ) {
          map[cell.date.getTime()].push(event);
        }
      });
    });

    return map;
  }, [cells, events]);

  return (
    <div className="grid grid-cols-7 border-t border-l border-border rounded-lg overflow-hidden">
      {WEEKDAYS.map((day) => (
        <div
          key={day}
          className="border-r border-b border-border p-3 text-center text-[0.8rem] font-semibold"
        >
          {day}
        </div>
      ))}
      {cells.map((cell) => {
        const timeKey = cell.date.getTime();
        const dayEvents = eventsByDay[timeKey] || [];

        return <DayCell key={timeKey} events={dayEvents} daycell={cell} />;
      })}
    </div>
  );
}
