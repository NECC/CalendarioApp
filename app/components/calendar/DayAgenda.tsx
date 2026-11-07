"use client";
// List of events on the selected day, each with its star.
import { StarIcon } from "@/app/components/calendar/StarIcon";
import { getCategoryColor } from "@/lib/category-colors";
import type { CalendarEvent } from "@/types/calendar";

interface DayAgendaProps {
  selectedDate: Date;
  /** Events on the selected day, already filtered. */
  events: CalendarEvent[];
  starredIds: Set<string>;
  onToggleStar: (id: string) => void;
  /** Message shown when there are stars but reminders cannot arrive. */
  notificationHint: string | null;
}

function StarButton({
  event,
  active,
  onToggle,
}: {
  event: CalendarEvent;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={active}
      aria-label={active ? `Remove star from ${event.title}` : `Star ${event.title}`}
      title={active ? "Remove star" : "Star (you get one reminder a day during the week before)"}
      className={`shrink-0 -mr-1 p-1 rounded-full transition active:scale-75 ${
        active ? "text-amber-400" : "opacity-60 hover:opacity-100"
      }`}
    >
      <StarIcon className="w-5 h-5" filled={active} />
    </button>
  );
}

/** Star for general events, book for subjects. */
function CategoryIcon({ category }: { category: string }) {
  if (category === "eventos") return <StarIcon className="w-4 h-4 shrink-0" />;
  return (
    <svg
      className="w-4 h-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" />
      <path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

export function DayAgenda({
  selectedDate,
  events,
  starredIds,
  onToggleStar,
  notificationHint,
}: DayAgendaProps) {
  const showHint = Boolean(notificationHint) && events.some((e) => starredIds.has(e.id));

  // "7 November 2026"
  const headerText = selectedDate
    .toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="flex-1 min-h-0 flex flex-col w-full bg-card rounded-3xl border border-border pt-4 px-4 pb-3 shadow-sm">
      <div className="flex items-center shrink-0 px-1 mb-2">
        <span className="text-lg font-bold text-gray-600 tracking-tight capitalize">
          {headerText}
        </span>
      </div>

      {showHint && (
        <p className="shrink-0 px-1 mb-2 text-xs text-muted-foreground">
          {notificationHint}
        </p>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col gap-2 pb-2">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No events on this day.
          </p>
        ) : (
          events.map((event) => {
            const color = getCategoryColor(event.category);

            return (
              <div
                key={event.id}
                title={event.title}
                className="shrink-0 flex items-center gap-3 px-3.5 py-3 rounded-2xl"
                style={{
                  backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
                  color: `color-mix(in srgb, ${color} 70%, var(--foreground))`,
                }}
              >
                <CategoryIcon category={event.category} />
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">{event.title}</p>
                <StarButton
                  event={event}
                  active={starredIds.has(event.id)}
                  onToggle={() => onToggleStar(event.id)}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
