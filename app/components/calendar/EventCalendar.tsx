"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TopBar } from "./TopBar";
import { MonthGrid } from "./MonthGrid";
import { CalendarSkeleton } from "./CalendarSkeleton";
import { DayAgenda } from "./DayAgenda";
import { FilterSheet } from "./FilterSheet";
import { useSwipe } from "@/hooks/useSwipe";
import { filterEvents } from "@/lib/event-filters";
import { defaultSelectedDate } from "@/lib/date-utils";
import type { YearFilter } from "@/lib/subjects";
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

interface CalendarState {
  month: Date;
  selected: Date;
}

export function EventCalendar({ initialEvents = [] }: EventCalendarProps) {
  // null até montar no cliente (evita mismatch de hidratação com new Date())
  const [calendar, setCalendar] = useState<CalendarState | null>(null);

  const [selectedYear, setSelectedYear] = useState<YearFilter>("all");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const now = new Date();
    setCalendar({
      month: new Date(now.getFullYear(), now.getMonth(), 1),
      selected: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    });
  }, []);

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

  const toggleSubject = useCallback((sigla: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(sigla) ? prev.filter((s) => s !== sigla) : [...prev, sigla],
    );
  }, []);

  const changeYear = useCallback((year: YearFilter) => {
    setSelectedYear(year);
    setSelectedSubjects([]); // trocar de ano limpa as disciplinas
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedYear("all");
    setSelectedSubjects([]);
  }, []);

  const filteredEvents = useMemo(
    () => filterEvents(initialEvents, selectedYear, selectedSubjects),
    [initialEvents, selectedYear, selectedSubjects],
  );

  if (!calendar) return <CalendarSkeleton />;

  const { month, selected } = calendar;
  const monthTitle = `${MONTH_KEYS[month.getMonth()].toUpperCase()} ${month.getFullYear()}`;
  const activeFilterCount =
    (selectedYear !== "all" ? 1 : 0) + selectedSubjects.length;

  return (
    <div className="flex flex-col w-full min-h-screen bg-background text-foreground p-4 gap-4 max-w-lg mx-auto relative overflow-hidden">
      <TopBar
        monthTitle={monthTitle}
        onPrevMonth={goPrev}
        onNextMonth={goNext}
        onOpenFilters={() => setIsFilterOpen(true)}
        activeFilterCount={activeFilterCount}
      />

      {/* Contentor com swipe: o interior (swipeRef) acompanha o dedo */}
      <div
        className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden select-none touch-pan-y"
        {...swipeHandlers}
      >
        <div ref={swipeRef} className="will-change-transform">
          <MonthGrid
            date={month}
            events={filteredEvents}
            selectedDate={selected}
            onSelectDate={selectDate}
          />
        </div>
      </div>

      <DayAgenda selectedDate={selected} events={filteredEvents} />

      {isFilterOpen && (
        <FilterSheet
          year={selectedYear}
          subjects={selectedSubjects}
          resultCount={filteredEvents.length}
          onYearChange={changeYear}
          onToggleSubject={toggleSubject}
          onClear={clearFilters}
          onClose={closeFilters}
        />
      )}
    </div>
  );
}
