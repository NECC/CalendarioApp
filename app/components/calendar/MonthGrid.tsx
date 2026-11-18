"use client";
// Grelha do mês: um círculo por dia, com pontos coloridos nos dias com eventos.
// Um evento que dura vários dias seguidos (o mesmo título em dias seguidos) é uma linha.
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

// Metade do espaço entre colunas (gap-x-1 = 4px), para as linhas se tocarem.
const HALF_GAP = "2px";
// Metade da largura de um ponto (w-1.5 = 6px).
const HALF_DOT = "3px";

/** Uma linha de um evento de vários dias, dentro de um dia. */
interface SpanPiece {
  category: string;
  /** O evento continua no dia anterior, na mesma semana. */
  left: boolean;
  /** O evento continua no dia seguinte, na mesma semana. */
  right: boolean;
}

const spanKey = (e: CalendarEvent) => `${e.category}|${e.title}`;

function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

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

  // Para cada dia: as linhas dos eventos de vários dias e os pontos dos outros (no máximo 3).
  const marksByDay = useMemo(() => {
    const keysByDay = new Map<string, Map<string, string>>(); // dia -> spanKey -> categoria
    for (const event of events) {
      const day = dayKey(new Date(event.startTimestampnz));
      const keys = keysByDay.get(day) ?? new Map<string, string>();
      keys.set(spanKey(event), event.category);
      keysByDay.set(day, keys);
    }

    const map = new Map<string, { spans: SpanPiece[]; dots: string[] }>();
    for (const { date: d, inMonth } of cells) {
      if (!inMonth) continue;
      const keys = keysByDay.get(dayKey(d));
      if (!keys) continue;
      const prev = keysByDay.get(dayKey(addDays(d, -1)));
      const next = keysByDay.get(dayKey(addDays(d, 1)));
      const firstOfMonth = d.getDate() === 1;
      const lastOfMonth = addDays(d, 1).getMonth() !== d.getMonth();

      const spans: SpanPiece[] = [];
      const dots: string[] = [];
      for (const key of [...keys.keys()].sort()) {
        const category = keys.get(key)!;
        const inPrev = prev?.has(key) ?? false;
        const inNext = next?.has(key) ?? false;
        if (inPrev || inNext) {
          spans.push({
            category,
            // A linha parte-se no fim da semana e do mês.
            left: inPrev && d.getDay() !== 0 && !firstOfMonth,
            right: inNext && d.getDay() !== 6 && !lastOfMonth,
          });
        } else if (!dots.includes(category) && dots.length < 3) {
          dots.push(category);
        }
      }
      map.set(dayKey(d), { spans, dots });
    }
    return map;
  }, [events, cells]);

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
          const { spans, dots } = marksByDay.get(dayKey(cellDate)) ?? { spans: [], dots: [] };

          return (
            <div
              key={`day-${day}`}
              className="min-h-0 flex items-center justify-center"
              // As linhas usam a largura da célula (cqw) para chegar à célula ao lado.
              style={{ containerType: "inline-size" }}
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

                {spans.map((span, i) => (
                  <div
                    key={`span-${i}`}
                    className="absolute h-1.5 z-10 pointer-events-none"
                    style={{
                      bottom: `calc(0.25rem + ${i} * 0.5rem)`,
                      left: span.left ? `calc(50% - 50cqw - ${HALF_GAP})` : `calc(50% - ${HALF_DOT})`,
                      right: span.right ? `calc(50% - 50cqw - ${HALF_GAP})` : `calc(50% - ${HALF_DOT})`,
                      borderRadius: `${span.left ? 0 : 9999}px ${span.right ? 0 : 9999}px ${span.right ? 0 : 9999}px ${span.left ? 0 : 9999}px`,
                      backgroundColor: getCategoryColor(span.category),
                    }}
                  />
                ))}

                {dots.length > 0 && (
                  <div
                    className="absolute left-0 right-0 flex gap-0.5 items-center justify-center pointer-events-none"
                    style={{ bottom: `calc(0.25rem + ${spans.length} * 0.5rem)` }}
                  >
                    {dots.map((cat) => (
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
