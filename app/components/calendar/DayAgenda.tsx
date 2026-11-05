"use client";

import type { calendarEvent } from "@/types/calendar";
import { getCategoryColor } from "../../../lib/category-colors";
import { ShareButton } from "./ShareButton";

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

const HOUR_MS = 60 * 60 * 1000;

function formatTime(event: calendarEvent): string {
  const start = new Date(event.startTimestampnz);
  const end = new Date(event.endTimestampnz);
  // Eventos de dia inteiro (>= 23h) mostram "Dia todo" em vez das horas
  if (end.getTime() - start.getTime() >= 23 * HOUR_MS) return "Dia todo";
  return `${start.toLocaleTimeString("pt-PT", TIME_FORMAT)} – ${end.toLocaleTimeString("pt-PT", TIME_FORMAT)}`;
}

function CategoryIcon({ category }: { category: string }) {
  const common = {
    className: "w-4 h-4 shrink-0",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };

  if (category === "eventos") {
    // estrela: eventos gerais
    return (
      <svg {...common}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  }
  // livro: cadeiras
  return (
    <svg {...common}>
      <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" />
      <path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

export function DayAgenda({ selectedDate, events }: DayAgendaProps) {
  // Formata a data e remove a palavra "de" (ex: "5 novembro 2026")
  const fullDate = selectedDate
    .toLocaleDateString("pt-PT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .replace(/ de /g, " ");

  // Removida a verificação de isToday para mostrar sempre apenas a data
  const headerText = fullDate;

  return (
    <div className="flex-1 min-h-0 flex flex-col w-full bg-card rounded-3xl border border-border pt-4 px-4 pb-3 shadow-sm">
      {/* Cabeçalho da Data */}
      <div className="flex items-center shrink-0 px-1 mb-2">
        <span className="text-lg font-bold text-gray-600 tracking-tight capitalize">
          {headerText}
        </span>
      </div>

      {/* Lista de Eventos (com scroll) */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col gap-2 pb-2">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Sem eventos para este dia.
          </p>
        ) : (
          events.map((event) => {
            const color = getCategoryColor(event.category);

            return (
              <div
                key={event.id}
                title={event.description || event.title}
                className="shrink-0 flex items-center gap-3 px-3.5 py-3 rounded-2xl"
                style={{
                  backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
                  color: `color-mix(in srgb, ${color} 70%, var(--foreground))`,
                }}
              >
                <CategoryIcon category={event.category} />
                <p className="min-w-0 flex-1 truncate text-sm">
                  <span className="font-semibold">{event.title}</span>
                  {event.description && (
                    <span className="text-xs opacity-70">
                      {" "}
                      · {event.description}
                    </span>
                  )}
                </p>
                <span className="shrink-0 text-xs font-medium tabular-nums">
                  {formatTime(event)}
                </span>
                <ShareButton event={event} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
