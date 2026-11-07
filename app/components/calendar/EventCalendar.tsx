"use client";
// Main screen: brings together the calendar, the day's agenda and the filters.
import { useCallback, useMemo, useState } from "react";
import { DayAgenda } from "@/app/components/calendar/DayAgenda";
import { FilterSheet } from "@/app/components/calendar/FilterSheet";
import { MonthGrid } from "@/app/components/calendar/MonthGrid";
import { TopBar } from "@/app/components/calendar/TopBar";
import { useEventFilters } from "@/hooks/useEventFilters";
import { usePushNotifications, type PushControls } from "@/hooks/usePushNotifications";
import { useStarred } from "@/hooks/useStarred";
import { useSwipe } from "@/hooks/useSwipe";
import { defaultSelectedDate, isSameDay } from "@/lib/date-utils";
import { filterEvents } from "@/lib/event-filters";
import type { CalendarEvent } from "@/types/calendar";

const MONTHS = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

interface CalendarState {
  month: Date;
  selected: Date;
}

/** Opens on today, or on the day given by a notification ("/?date=YYYY-MM-DD"). */
function initialCalendar(): CalendarState {
  const now = new Date();
  const param = new URLSearchParams(window.location.search).get("date");
  const match = param?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const day = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return { month: new Date(day.getFullYear(), day.getMonth(), 1), selected: day };
}

/** Agenda message when there are stars but reminders cannot arrive. */
function getNotificationHint(push: PushControls): string | null {
  if (push.syncError) return push.syncError;
  if (push.status === "on" || push.status === "loading") return null;
  if (push.message) return push.message;
  if (push.status === "ios-not-installed")
    return "To get reminders on iPhone, install the app: tap Share, then Add to Home Screen.";
  if (push.status === "denied")
    return "Notifications are blocked. Allow them for this site in your phone or browser settings.";
  if (push.status === "unsupported") return "This browser does not support notifications.";
  return "Reminders are off. You can turn them on in Filters.";
}

// This component only renders in the browser: the page shows the skeleton until the
// data arrives, so window and localStorage are safe to use right away.
export function EventCalendar({ events }: { events: CalendarEvent[] }) {
  const [calendar, setCalendar] = useState<CalendarState>(initialCalendar);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { month, selected } = calendar;

  const filters = useEventFilters();
  const { starred, starredSet, toggleStar } = useStarred();
  const push = usePushNotifications(starred);

  // Starring turns reminders on. The permission request must come directly from the tap.
  const { enableFromStar } = push;
  const handleToggleStar = useCallback(
    (id: string) => {
      const adding = !starredSet.has(id);
      toggleStar(id);
      if (adding) enableFromStar();
    },
    [starredSet, toggleStar, enableFromStar],
  );

  // Change month by swiping
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

  // Events to show
  const filteredEvents = useMemo(
    () => filterEvents(events, filters.years, filters.subjects),
    [events, filters.years, filters.subjects],
  );
  const dayEvents = useMemo(
    () => filteredEvents.filter((e) => isSameDay(new Date(e.startTimestampnz), selected)),
    [filteredEvents, selected],
  );
  const hasDayEvents = dayEvents.length > 0;

  // Keeps the last day with events, so the content does not vanish suddenly
  // while the agenda animates closed.
  const [lastAgenda, setLastAgenda] = useState<{ date: Date; events: CalendarEvent[] } | null>(null);
  if (hasDayEvents && lastAgenda?.events !== dayEvents) {
    setLastAgenda({ date: selected, events: dayEvents });
  }
  const agenda = hasDayEvents ? { date: selected, events: dayEvents } : lastAgenda;

  return (
    <div className="flex flex-col w-full h-dvh bg-background text-foreground px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] max-w-lg mx-auto relative overflow-hidden">
      <div className="shrink-0 mb-4">
        <TopBar
          monthTitle={`${MONTHS[month.getMonth()]} ${month.getFullYear()}`}
          onOpenFilters={() => setIsFilterOpen(true)}
          activeFilterCount={filters.years.length + filters.subjects.length}
        />
      </div>

      {/* Calendar */}
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

      {/* Day agenda: always mounted, and opens or closes with an animation */}
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
          push={push}
        />
      )}
    </div>
  );
}
