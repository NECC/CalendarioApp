"use client";
// Ecrã principal: junta o calendário, a agenda do dia e os filtros.
import { useCallback, useMemo, useState } from "react";
import { DayAgenda } from "@/app/components/calendar/DayAgenda";
import { FilterSheet } from "@/app/components/calendar/FilterSheet";
import { MonthGrid } from "@/app/components/calendar/MonthGrid";
import { NotificationsSheet } from "@/app/components/calendar/NotificationsSheet";
import { TopBar } from "@/app/components/calendar/TopBar";
import { useEventFilters } from "@/hooks/useEventFilters";
import { usePushNotifications, type PushControls } from "@/hooks/usePushNotifications";
import { useStarred } from "@/hooks/useStarred";
import { useSwipe } from "@/hooks/useSwipe";
import { defaultSelectedDate, isSameDay } from "@/lib/date-utils";
import { filterEvents } from "@/lib/event-filters";
import type { CalendarEvent } from "@/types/calendar";

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

interface CalendarState {
  month: Date;
  selected: Date;
}

/** Abre em hoje, ou no dia indicado por uma notificação ("/?date=YYYY-MM-DD"). */
function initialCalendar(): CalendarState {
  const now = new Date();
  const param = new URLSearchParams(window.location.search).get("date");
  const match = param?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const day = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return { month: new Date(day.getFullYear(), day.getMonth(), 1), selected: day };
}

/** Mensagem da agenda quando há estrelas mas os avisos não podem chegar. */
function getNotificationHint(push: PushControls): string | null {
  if (push.syncError) return push.syncError;
  if (push.status === "on" || push.status === "loading") return null;
  // Sem internet os avisos ligam-se sozinhos quando a ligação voltar.
  if (push.status === "off" && !navigator.onLine) return null;
  if (push.message) return push.message;
  if (push.status === "ios-not-installed")
    return "Para receberes avisos no iPhone, instala a app: toca em Partilhar e depois em Adicionar ao ecrã principal.";
  if (push.status === "denied")
    return "As notificações estão bloqueadas. Ativa-as nas definições do telemóvel ou do browser para este site.";
  if (push.status === "unsupported") return "Este browser não suporta notificações.";
  return "Os avisos estão desligados. Podes ligá-los no sino, no topo.";
}

// Este componente só é desenhado no browser: a página mostra o esqueleto até os dados
// chegarem, por isso window e localStorage podem ser usados logo.
export function EventCalendar({ events }: { events: CalendarEvent[] }) {
  const [calendar, setCalendar] = useState<CalendarState>(initialCalendar);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { month, selected } = calendar;

  const filters = useEventFilters();
  const { starred, starredSet, toggleStar } = useStarred(events);
  const push = usePushNotifications(starred);

  // Dar uma estrela liga os avisos. O pedido de permissão tem de vir diretamente do toque.
  const { enableFromStar } = push;
  const handleToggleStar = useCallback(
    (id: string) => {
      const adding = !starredSet.has(id);
      toggleStar(id);
      if (adding) enableFromStar();
    },
    [starredSet, toggleStar, enableFromStar],
  );

  // Mudar de mês ao deslizar
  const changeMonth = useCallback((delta: number) => {
    setCalendar((prev) => {
      const next = new Date(prev.month.getFullYear(), prev.month.getMonth() + delta, 1);
      return { month: next, selected: defaultSelectedDate(next) };
    });
  }, []);
  const goNext = useCallback(() => changeMonth(1), [changeMonth]);
  const goPrev = useCallback(() => changeMonth(-1), [changeMonth]);
  const { ref: swipeRef, handlers: swipeHandlers } = useSwipe<HTMLDivElement>({
    onSwipeLeft: goNext,
    onSwipeRight: goPrev,
  });

  const selectDate = useCallback((date: Date) => {
    setCalendar((prev) => ({ ...prev, selected: date }));
  }, []);
  const closeFilters = useCallback(() => setIsFilterOpen(false), []);
  const closeNotifications = useCallback(() => setIsNotificationsOpen(false), []);

  /** Vindo da lista dos avisos: abre o mês desse dia e seleciona-o. */
  const goToDate = useCallback((date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    setCalendar({ month: new Date(day.getFullYear(), day.getMonth(), 1), selected: day });
  }, []);

  const goToday = useCallback(() => goToDate(new Date()), [goToDate]);
  const now = new Date();
  const isCurrentMonth = month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth();

  const upcomingStarredCount = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return events.filter((e) => starredSet.has(e.id) && new Date(e.startTimestampnz) >= today).length;
  }, [events, starredSet]);

  // Eventos a mostrar
  const filteredEvents = useMemo(
    () => filterEvents(events, filters.years, filters.subjects),
    [events, filters.years, filters.subjects],
  );
  const dayEvents = useMemo(
    () => filteredEvents.filter((e) => isSameDay(new Date(e.startTimestampnz), selected)),
    [filteredEvents, selected],
  );
  const hasDayEvents = dayEvents.length > 0;

  // Guarda o último dia com eventos, para o conteúdo não desaparecer de repente
  // enquanto a agenda fecha com a animação.
  const [lastAgenda, setLastAgenda] = useState<{ date: Date; events: CalendarEvent[] } | null>(null);
  if (hasDayEvents && lastAgenda?.events !== dayEvents) {
    setLastAgenda({ date: selected, events: dayEvents });
  }
  const agenda = hasDayEvents ? { date: selected, events: dayEvents } : lastAgenda;

  return (
    <div className="flex flex-col w-full h-dvh bg-background text-foreground px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] max-w-lg mx-auto relative overflow-hidden">
      <div className="shrink-0 mb-4">
        <TopBar
          monthName={MONTHS[month.getMonth()]}
          year={month.getFullYear()}
          onOpenFilters={() => setIsFilterOpen(true)}
          activeFilterCount={filters.years.length + filters.subjects.length}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          upcomingStarredCount={upcomingStarredCount}
          showToday={!isCurrentMonth}
          onGoToday={goToday}
        />
      </div>

      {/* Calendário */}
      <div
        style={{ flexGrow: 3 }}
        className="basis-0 min-h-0 flex flex-col bg-card rounded-3xl border border-border shadow-sm overflow-hidden select-none touch-pan-y"
        {...swipeHandlers}
      >
        <div ref={swipeRef} className="flex-1 min-h-0 flex flex-col will-change-transform">
          <MonthGrid
            date={month}
            events={filteredEvents}
            selectedDate={selected}
            onSelectDate={selectDate}
            starredIds={starredSet}
          />
        </div>
      </div>

      {/* Agenda do dia: sempre montada, abre e fecha com uma animação */}
      <div
        style={{ flexGrow: hasDayEvents ? 1 : 0 }}
        aria-hidden={!hasDayEvents}
        className={`basis-0 flex flex-col overflow-hidden transition-[flex-grow,min-height,margin,opacity] duration-300 ease-out motion-reduce:transition-none ${
          hasDayEvents
            ? "min-h-[10rem] mt-4 opacity-100"
            : "min-h-0 mt-0 opacity-0 pointer-events-none"
        }`}
      >
        {agenda && (
          <DayAgenda
            selectedDate={agenda.date}
            events={agenda.events}
            starredIds={starredSet}
            onToggleStar={handleToggleStar}
            notificationHint={getNotificationHint(push)}
          />
        )}
      </div>

      {isFilterOpen && (
        <FilterSheet
          years={filters.years}
          subjects={filters.subjects}
          resultCount={filteredEvents.length}
          onToggleYear={filters.toggleYear}
          onToggleSubject={filters.toggleSubject}
          onClear={filters.clearFilters}
          onClose={closeFilters}
        />
      )}

      {isNotificationsOpen && (
        <NotificationsSheet
          events={events}
          starredIds={starredSet}
          onToggleStar={toggleStar}
          onSelectDate={goToDate}
          onClose={closeNotifications}
          push={push}
        />
      )}
    </div>
  );
}
