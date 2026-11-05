"use client";

import type { calendarEvent } from "@/types/calendar";
import { getCategoryColor } from "../../../lib/category-colors";
import { isSameDay } from "../../../lib/date-utils";

interface DayAgendaProps {
  selectedDate: Date;
  /** Eventos do dia selecionado, já filtrados e ordenados por hora. */
  events: calendarEvent[];
}

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

export function DayAgenda({ selectedDate, events }: DayAgendaProps) {
  const dayNumber = selectedDate.getDate();
  const dayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" });
  const isToday = isSameDay(selectedDate, new Date());
  const label = isToday
    ? "Today"
    : selectedDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });

  return (
    <div className="flex-1 min-h-0 flex flex-col w-full bg-card rounded-3xl border border-border pt-4 px-5 pb-3 shadow-sm">
      {/* Cabeçalho numa só linha */}
      <div className="flex items-baseline gap-2 shrink-0">
        <span className="text-3xl font-extrabold text-foreground tracking-tight">
          {dayNumber}
        </span>
        <span className="text-sm font-semibold text-foreground">{dayName}</span>
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>

      {/* Só esta lista faz scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col gap-2 mt-3 pb-2">
        {events.map((event) => {
          const startTime = new Date(event.startTimestampnz).toLocaleTimeString(
            [],
            TIME_FORMAT,
          );
          const endTime = new Date(event.endTimestampnz).toLocaleTimeString(
            [],
            TIME_FORMAT,
          );

          return (
            <div
              key={event.id}
              className="shrink-0 flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-muted/10 border border-border/50 transition-all hover:border-accent/40 border-l-4"
              style={{ borderLeftColor: getCategoryColor(event.category) }}
              title={event.description || event.title}
            >
              <span className="shrink-0 text-[11px] font-bold tracking-wide text-muted-foreground tabular-nums">
                {startTime}–{endTime}
              </span>
              <p className="min-w-0 flex-1 truncate text-sm">
                <span className="font-bold text-foreground">{event.title}</span>
                {event.description && (
                  <span className="text-xs text-muted-foreground">
                    {" "}
                    · {event.description}
                  </span>
                )}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
