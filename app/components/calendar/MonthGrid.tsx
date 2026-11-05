"use client";

import { memo, useMemo } from "react";
import type { calendarEvent } from "@/types/calendar";
import { getCategoryColor } from "../../../lib/category-colors";
import { dayKey, isSameDay } from "../../../lib/date-utils";

interface MonthGridProps {
  date: Date;
  events: calendarEvent[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TOTAL_CELLS = 42; // 6 semanas: altura constante entre meses

export const MonthGrid = memo(function MonthGrid({
  date,
  events,
  selectedDate,
  onSelectDate,
}: MonthGridProps) {
  const year = date.getFullYear();
  const month = date.getMonth();

  // 42 células; os dias fora do mês aparecem esbatidos
  const cells = useMemo(() => {
    const firstWeekday = new Date(year, month, 1).getDay();
    return Array.from({ length: TOTAL_CELLS }, (_, i) => {
      const d = new Date(year, month, 1 - firstWeekday + i);
      return { date: d, inMonth: d.getMonth() === month };
    });
  }, [year, month]);

  // Categorias únicas (máx. 3) por dia, calculadas numa só passagem
  const categoriesByDay = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const event of events) {
      const key = dayKey(new Date(event.startTimestampnz));
      const list = map.get(key) ?? [];
      if (!list.includes(event.category) && list.length < 3) {
        list.push(event.category);
      }
      map.set(key, list);
    }
    return map;
  }, [events]);

  const today = new Date();

  return (
    <div className="w-full bg-card p-4 rounded-3xl pb-6">
      <div className="grid grid-cols-7 mb-4">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-[11px] font-bold text-muted-foreground uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-3 gap-x-1 justify-items-center">
        {cells.map(({ date: cellDate, inMonth }) => {
          const day = cellDate.getDate();

          if (!inMonth) {
            return (
              <div
                key={`out-${cellDate.getTime()}`}
                className="w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium text-muted-foreground/30"
                aria-hidden="true"
              >
                {day}
              </div>
            );
          }

          const isToday = isSameDay(cellDate, today);
          const isSelected = isSameDay(cellDate, selectedDate);
          const categories = categoriesByDay.get(dayKey(cellDate)) ?? [];

          return (
            <div
              key={`day-${day}`}
              className="relative flex justify-center items-center w-10 h-10"
            >
              <button
                onClick={() => onSelectDate(cellDate)}
                aria-pressed={isSelected}
                aria-current={isToday ? "date" : undefined}
                aria-label={cellDate.toLocaleDateString("pt-PT", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                className={`w-full h-full flex items-center justify-center rounded-full text-sm font-semibold transition-all active:scale-95 ${
                  isSelected
                    ? "bg-foreground text-background shadow-md"
                    : isToday
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : "text-foreground hover:bg-muted/20"
                }`}
              >
                {day}
              </button>

              {categories.length > 0 && (
                <div className="absolute bottom-1 flex gap-0.5 items-center justify-center pointer-events-none">
                  {categories.map((cat) => (
                    <div
                      key={cat}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: getCategoryColor(cat) }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
