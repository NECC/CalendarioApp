"use client";
// Grelha do mês: um círculo por dia, com pontos coloridos nos dias com eventos.
import { memo, useMemo } from "react";
import { StarIcon } from "@/app/components/calendar/StarIcon";
import { getCategoryColor } from "@/lib/category-colors";
import { dayKey, isSameDay } from "@/lib/date-utils";
import type { CalendarEvent } from "@/types/calendar";

interface MonthGridProps {
  date: Date;
  events: CalendarEvent[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  /** IDs dos eventos com estrela (o seu dia mostra uma pequena estrela). */
  starredIds: Set<string>;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Cada dia é um círculo que cresce com a altura disponível (até 2.75rem)
const DAY_BOX = "relative h-full max-h-11 aspect-square";

export const MonthGrid = memo(function MonthGrid({
  date,
  events,
  selectedDate,
  onSelectDate,
  starredIds,
}: MonthGridProps) {
  const year = date.getFullYear();
  const month = date.getMonth();

  // Só as semanas de que o mês precisa (4, 5 ou 6), a dividir a altura toda.
  const { cells, weeks } = useMemo(() => {
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weeks = Math.ceil((firstWeekday + daysInMonth) / 7);
    const cells = Array.from({ length: weeks * 7 }, (_, i) => {
      const d = new Date(year, month, 1 - firstWeekday + i);
      return { date: d, inMonth: d.getMonth() === month };
    });
    return { cells, weeks };
  }, [year, month]);

  // Categorias de cada dia, no máximo 3 pontos.
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

  const starredDays = useMemo(() => {
    const set = new Set<string>();
    for (const event of events) {
      if (starredIds.has(event.id)) set.add(dayKey(new Date(event.startTimestampnz)));
    }
    return set;
  }, [events, starredIds]);

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

      <div
        className="flex-1 min-h-0 grid grid-cols-7 gap-x-1"
        style={{ gridTemplateRows: `repeat(${weeks}, minmax(0, 1fr))` }}
      >
        {cells.map(({ date: cellDate, inMonth }) => {
          const day = cellDate.getDate();

          // Dias de outros meses: uma célula vazia, que mantém os dias da semana alinhados.
          if (!inMonth) {
            return <div key={`out-${cellDate.getTime()}`} aria-hidden="true" />;
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

                {starredDays.has(dayKey(cellDate)) && (
                  <StarIcon
                    className="absolute -top-0.5 -right-0.5 w-3 h-3 text-amber-400 pointer-events-none"
                    filled
                    outlined={false}
                  />
                )}

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
