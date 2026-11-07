"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TopBar } from "./TopBar";
import { MonthGrid } from "./MonthGrid";
import { CalendarSkeleton } from "./CalendarSkeleton";
import { DayAgenda } from "./DayAgenda";
import { FilterSheet } from "./FilterSheet";
import { useSwipe } from "../../../hooks/useSwipe";
import { useStarred } from "../../../hooks/useStarred";
import { usePushNotifications } from "../../../hooks/usePushNotifications";
import { filterEvents } from "../../../lib/event-filters";
import { defaultSelectedDate, isSameDay } from "../../../lib/date-utils";
import { SUBJECTS_DATA } from "../../../lib/subjects";
import type { calendarEvent, Category } from "@/types/calendar";

const MONTH_KEYS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

interface EventCalendarProps {
  initialEvents?: calendarEvent[];
  /** Não é usado neste componente; mantido para não quebrar quem o passa. */
  initialCategories?: Category[];
}

const FILTERS_KEY = "necc-filters";

function loadSavedFilters(): { years: number[]; subjects: string[] } {
  try {
    const saved = JSON.parse(localStorage.getItem(FILTERS_KEY) ?? "{}");
    return {
      years: Array.isArray(saved.years) ? saved.years : [],
      subjects: Array.isArray(saved.subjects) ? saved.subjects : [],
    };
  } catch {
    return { years: [], subjects: [] };
  }
}

interface CalendarState {
  month: Date;
  selected: Date;
}

function initialCalendar(): CalendarState | null {
  if (typeof window === "undefined") return null;
  // Abrir num dia específico: as notificações abrem "/?date=YYYY-MM-DD".
  const now = new Date();
  const param = new URLSearchParams(window.location.search).get("date");
  const match = param?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const day = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return { month: new Date(day.getFullYear(), day.getMonth(), 1), selected: day };
}

export function EventCalendar({ initialEvents = [] }: EventCalendarProps) {
  // Só monta no cliente: a página mostra o esqueleto até os dados chegarem.
  const [calendar, setCalendar] = useState<CalendarState | null>(initialCalendar);

  // Anos inteiros e disciplinas soltas, combináveis e guardados no dispositivo.
  const [selectedYears, setSelectedYears] = useState<number[]>(
    () => loadSavedFilters().years,
  );
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    () => loadSavedFilters().subjects,
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(
        FILTERS_KEY,
        JSON.stringify({ years: selectedYears, subjects: selectedSubjects }),
      );
    } catch {}
  }, [selectedYears, selectedSubjects]);

  // O hook vive aqui, e não nos filtros, para as estrelas sincronizarem logo.
  const { starred, starredSet, toggleStar } = useStarred();
  const pushPrefs = useMemo(
    () => ({ years: selectedYears, subjects: selectedSubjects, starred }),
    [selectedYears, selectedSubjects, starred],
  );
  const push = usePushNotifications(pushPrefs);

  // A permissão só pode ser pedida em resposta direta a um toque.
  const { enableFromStar } = push;
  const handleToggleStar = useCallback(
    (id: string) => {
      const adding = !starredSet.has(id);
      toggleStar(id);
      if (adding) enableFromStar();
    },
    [starredSet, toggleStar, enableFromStar],
  );

  const notificationHint = (() => {
    if (push.syncError) return push.syncError;
    if (push.status === "on" || push.status === "loading") return null;
    if (push.message) return push.message;
    if (push.status === "ios-not-installed")
      return "Para receberes avisos no iPhone, instala a app: toca em Partilhar e depois em Adicionar ao ecrã principal.";
    if (push.status === "denied")
      return "As notificações estão bloqueadas. Ativa-as nas definições do telemóvel/browser para este site.";
    if (push.status === "unsupported")
      return "Este browser não suporta notificações.";
    return "Os avisos estão desligados. Podes ligá-los nos filtros.";
  })();

  const changeMonth = useCallback((delta: number) => {
    setCalendar((prev) => {
      if (!prev) return prev;
      const month = new Date(
        prev.month.getFullYear(),
        prev.month.getMonth() + delta,
        1,
      );
      return { month, selected: defaultSelectedDate(month) };
    });
  }, []);

  const goNext = useCallback(() => changeMonth(1), [changeMonth]);
  const goPrev = useCallback(() => changeMonth(-1), [changeMonth]);

  const selectDate = useCallback((date: Date) => {
    setCalendar((prev) => (prev ? { ...prev, selected: date } : prev));
  }, []);

  const { ref: swipeRef, handlers: swipeHandlers } = useSwipe<HTMLDivElement>({
    onSwipeLeft: goNext,
    onSwipeRight: goPrev,
  });

  const closeFilters = useCallback(() => setIsFilterOpen(false), []);

  // Marcar um ano inteiro substitui as disciplinas soltas desse ano
  const toggleYear = useCallback((year: number) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year],
    );
    setSelectedSubjects((prev) =>
      prev.filter(
        (sigla) => SUBJECTS_DATA.find((s) => s.sigla === sigla)?.year !== year,
      ),
    );
  }, []);

  const toggleSubject = useCallback(
    (sigla: string) => {
      const subject = SUBJECTS_DATA.find((s) => s.sigla === sigla);
      if (!subject) return;

      // Desmarcar uma disciplina de um ano inteiro selecionado:
      // o ano passa a disciplinas explícitas, menos a desmarcada.
      if (selectedYears.includes(subject.year)) {
        setSelectedYears((prev) => prev.filter((y) => y !== subject.year));
        setSelectedSubjects((prev) => [
          ...prev,
          ...SUBJECTS_DATA.filter(
            (s) => s.year === subject.year && s.sigla !== sigla,
          ).map((s) => s.sigla),
        ]);
        return;
      }

      setSelectedSubjects((prev) =>
        prev.includes(sigla)
          ? prev.filter((s) => s !== sigla)
          : [...prev, sigla],
      );
    },
    [selectedYears],
  );

  const clearFilters = useCallback(() => {
    setSelectedYears([]);
    setSelectedSubjects([]);
  }, []);

  const filteredEvents = useMemo(
    () => filterEvents(initialEvents, selectedYears, selectedSubjects),
    [initialEvents, selectedYears, selectedSubjects],
  );

  const selectedDay = calendar?.selected;
  const dayEvents = useMemo(() => {
    if (!selectedDay) return [];
    return filteredEvents
      .filter((e) => isSameDay(new Date(e.startTimestampnz), selectedDay))
      .sort(
        (a, b) =>
          new Date(a.startTimestampnz).getTime() -
          new Date(b.startTimestampnz).getTime(),
      );
  }, [filteredEvents, selectedDay]);

  // Mantém o conteúdo visível enquanto a agenda anima ao fechar.
  const [lastAgenda, setLastAgenda] = useState<{
    date: Date;
    events: calendarEvent[];
  } | null>(null);
  if (selectedDay && dayEvents.length > 0 && lastAgenda?.events !== dayEvents) {
    setLastAgenda({ date: selectedDay, events: dayEvents });
  }

  if (!calendar) return <CalendarSkeleton />;

  const { month, selected } = calendar;
  const hasDayEvents = dayEvents.length > 0;
  const agenda = hasDayEvents
    ? { date: selected, events: dayEvents }
    : lastAgenda;
  const monthTitle = `${MONTH_KEYS[month.getMonth()].toUpperCase()} ${month.getFullYear()}`;
  const activeFilterCount = selectedYears.length + selectedSubjects.length;

  return (
    <div className="flex flex-col w-full h-dvh bg-background text-foreground px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] max-w-lg mx-auto relative overflow-hidden">
      <div className="shrink-0 mb-4">
        <TopBar
          monthTitle={monthTitle}
          onOpenFilters={() => setIsFilterOpen(true)}
          activeFilterCount={activeFilterCount}
        />
      </div>

      <div
        style={{ flexGrow: 3 }}
        className="basis-0 min-h-0 flex flex-col bg-card rounded-3xl border border-border shadow-sm overflow-hidden select-none touch-pan-y"
        {...swipeHandlers}
      >
        <div
          ref={swipeRef}
          className="flex-1 min-h-0 flex flex-col will-change-transform"
        >
          <MonthGrid
            date={month}
            events={filteredEvents}
            selectedDate={selected}
            onSelectDate={selectDate}
            starredIds={starredSet}
          />
        </div>
      </div>

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
            notificationHint={notificationHint}
          />
        )}
      </div>

      {isFilterOpen && (
        <FilterSheet
          years={selectedYears}
          subjects={selectedSubjects}
          resultCount={filteredEvents.length}
          onToggleYear={toggleYear}
          onToggleSubject={toggleSubject}
          onClear={clearFilters}
          onClose={closeFilters}
          push={push}
        />
      )}
    </div>
  );
}
