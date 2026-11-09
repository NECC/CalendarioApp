"use client";
// Painel dos avisos: o interruptor e todos os testes com estrela, por ordem de data.
import { useMemo } from "react";
import { BottomSheet, useCloseSheet } from "@/app/components/calendar/BottomSheet";
import { NotificationSettings } from "@/app/components/calendar/NotificationSettings";
import { StarIcon } from "@/app/components/calendar/StarIcon";
import type { PushControls } from "@/hooks/usePushNotifications";
import { getCategoryColor } from "@/lib/category-colors";
import type { CalendarEvent } from "@/types/calendar";

interface NotificationsSheetProps {
  /** Todos os eventos, sem filtros: uma estrela conta mesmo que o filtro a esconda. */
  events: CalendarEvent[];
  starredIds: Set<string>;
  onToggleStar: (id: string) => void;
  /** Abre o calendário nesse dia. */
  onSelectDate: (date: Date) => void;
  onClose: () => void;
  push: PushControls;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** "Hoje", "Amanhã", ou "qui, 12 nov". */
function formatDate(date: Date, today: Date): string {
  const days = Math.round((startOfDay(date).getTime() - today.getTime()) / DAY_MS);
  if (days === 0) return "Hoje";
  if (days === 1) return "Amanhã";
  const weekday = date.toLocaleDateString("pt-PT", { weekday: "short" }).replace(".", "");
  const month = date.toLocaleDateString("pt-PT", { month: "short" }).replace(".", "");
  const year = date.getFullYear() !== today.getFullYear() ? ` ${date.getFullYear()}` : "";
  return `${weekday}, ${date.getDate()} ${month}${year}`;
}

function StarredRow({
  event,
  date,
  label,
  past,
  onSelect,
  onUnstar,
}: {
  event: CalendarEvent;
  date: Date;
  label: string;
  past: boolean;
  onSelect: (date: Date) => void;
  onUnstar: () => void;
}) {
  const color = getCategoryColor(event.category);
  const close = useCloseSheet();
  return (
    <div
      className={`shrink-0 flex items-center gap-3 pl-3.5 pr-2.5 py-3 rounded-2xl transition-opacity ${
        past ? "opacity-50" : ""
      }`}
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
        color: `color-mix(in srgb, ${color} 70%, var(--foreground))`,
      }}
    >
      <button
        onClick={() => {
          onSelect(date);
          close();
        }}
        title={`Ver ${event.title} no calendário`}
        className="min-w-0 flex-1 flex items-center gap-3 text-left"
      >
        <span className="w-2 h-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{event.title}</span>
        <span className="shrink-0 text-[11px] font-medium opacity-75 tabular-nums">{label}</span>
      </button>
      <button
        onClick={onUnstar}
        aria-label={`Tirar estrela de ${event.title}`}
        title="Tirar estrela"
        className="shrink-0 p-1 rounded-full text-amber-400 transition active:scale-75"
      >
        <StarIcon className="w-5 h-5" filled />
      </button>
    </div>
  );
}

export function NotificationsSheet({
  events,
  starredIds,
  onToggleStar,
  onSelectDate,
  onClose,
  push,
}: NotificationsSheetProps) {
  const { upcoming, past, today } = useMemo(() => {
    const today = startOfDay(new Date());
    const starred = events
      .filter((e) => starredIds.has(e.id))
      .map((event) => ({ event, date: new Date(event.startTimestampnz) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    return {
      today,
      upcoming: starred.filter((s) => s.date >= today),
      // Os já passados ficam no fim, do mais recente para o mais antigo.
      past: starred.filter((s) => s.date < today).reverse(),
    };
  }, [events, starredIds]);

  const renderRow = ({ event, date }: { event: CalendarEvent; date: Date }, isPast: boolean) => (
    <StarredRow
      key={event.id}
      event={event}
      date={date}
      label={formatDate(date, today)}
      past={isPast}
      onSelect={onSelectDate}
      onUnstar={() => onToggleStar(event.id)}
    />
  );

  return (
    <BottomSheet title="Avisos" onClose={onClose}>
      <NotificationSettings push={push} />

      <h4 className="px-1 mb-2 text-sm font-semibold text-muted-foreground">Testes com estrela</h4>

      {upcoming.length === 0 && past.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
          <StarIcon className="w-6 h-6 opacity-60" />
          <p className="text-sm max-w-[16rem]">
            Ainda não tens testes com estrela. Toca na estrela de um teste para receberes avisos.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {upcoming.length === 0 && (
            <p className="text-sm text-muted-foreground py-2 px-1">Sem testes por vir.</p>
          )}
          {upcoming.map((s) => renderRow(s, false))}

          {past.length > 0 && (
            <>
              <h4 className="px-1 mt-4 text-sm font-semibold text-muted-foreground">Já passaram</h4>
              {past.map((s) => renderRow(s, true))}
            </>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
