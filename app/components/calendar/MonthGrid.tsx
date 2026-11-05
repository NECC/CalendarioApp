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

// Cada dia é um círculo que cresce com a altura disponível (até 2.75rem)
const DAY_BOX = "relative h-full max-h-11 aspect-square";

export const MonthGrid = memo(function MonthGrid({
  date,
  events,
  selectedDate,
  onSelectDate,
}: MonthGridProps) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const cells = useMemo(() => {
    const firstWeekday = new Date(year, month, 1).getDay();
    return Array.from({ length: TOTAL_CELLS }, (_, i) => {
      const d = new Date(year, month, 1 - firstWeekday + i);
      return { date: d, inMonth: d.getMonth() === month };
    });
  }, [year, month]);

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
    <div className="w-full flex-1 min-h-0 flex flex-col bg-card p-4 rounded-3xl">
      <div className="grid grid-cols-7 mb-2 shrink-0">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-[11px] font-bold text-muted-foreground uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 6 linhas que repartem a altura toda do cartão */}
      <div className="flex-1 min-h-0 grid grid-cols-7 grid-rows-6 gap-x-1">
        {cells.map(({ date: cellDate, inMonth }) => {
          const day = cellDate.getDate();

          if (!inMonth) {
            return (
              <div
                key={`out-${cellDate.getTime()}`}
                className="min-h-0 flex items-center justify-center"
                aria-hidden="true"
              >
                <div
                  className={`${DAY_BOX} flex items-center justify-center rounded-full text-sm font-medium text-muted-foreground/30`}
                >
                  {day}
                </div>
              </div>
            );
          }

          const isToday = isSameDay(cellDate, today);
          const isSelected = isSameDay(cellDate, selectedDate);
          const categories = categoriesByDay.get(dayKey(cellDate)) ?? [];

          return (
            <div
              key={`day-${day}`}
              className="min-h-0 flex items-center justify-center"
            >
              <div className={DAY_BOX}>
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
                      ? "bg-foreground/15 text-foreground shadow-sm"
                      : isToday
                        ? "bg-accent/15 text-accent border border-accent/30"
                        : "text-foreground hover:bg-muted/20"
                  }`}
                >
                  {day}
                </button>

                {categories.length > 0 && (
                  <div className="absolute bottom-1 left-0 right-0 flex gap-0.5 items-center justify-center pointer-events-none">
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
            </div>
          );
        })}
      </div>
    </div>
  );
});
