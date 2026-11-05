"use client";

import { useMemo } from "react";
import type { calendarEvent } from "@/types/calendar";
import { getCategoryColor } from "@/lib/category-colors";
import { isSameDay } from "@/lib/date-utils";

interface DayAgendaProps {
  selectedDate: Date;
  events: calendarEvent[];
}

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
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

  const dayEvents = useMemo(
    () =>
      events
        .filter((e) => isSameDay(new Date(e.startTimestampnz), selectedDate))
        .sort(
          (a, b) =>
            new Date(a.startTimestampnz).getTime() -
            new Date(b.startTimestampnz).getTime(),
        ),
    [events, selectedDate],
  );

  return (
    <div className="flex flex-col gap-3 w-full bg-card rounded-3xl border border-border p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-extrabold text-foreground tracking-tight">
            {dayNumber}
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {label}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {dayName}
            </span>
          </div>
        </div>

        <span className="text-xs font-medium px-3 py-1 rounded-full bg-muted/20 text-foreground/80">
          {dayEvents.length} {dayEvents.length === 1 ? "event" : "events"}
        </span>
      </div>

      <div className="flex flex-col gap-2.5 mt-2">
        {dayEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            Sem eventos para este dia.
          </p>
        ) : (
          dayEvents.map((event) => {
            const startTime = new Date(
              event.startTimestampnz,
            ).toLocaleTimeString([], TIME_FORMAT);
            const endTime = new Date(event.endTimestampnz).toLocaleTimeString(
              [],
              TIME_FORMAT,
            );

            return (
              <div
                key={event.id}
                className="flex flex-col p-3.5 rounded-2xl bg-muted/10 border border-border/50 gap-1 transition-all hover:border-accent/40 border-l-4"
                style={{ borderLeftColor: getCategoryColor(event.category) }}
              >
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  {startTime} - {endTime}
                </span>
                <span className="text-sm font-bold text-foreground">
                  {event.title}
                </span>
                {event.description && (
                  <span className="text-xs text-muted-foreground">
                    {event.description}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
