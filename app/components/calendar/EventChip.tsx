import type { calendarEvent } from "@/types/calendar";
import { formatEventRange } from "@/lib/calendar-utils";

const CATEGORY_COLORS: Record<string, string> = {
  all: "var(--color-all)",
  event: "var(--color-event)",
  exam: "var(--color-exam)",
};

export function EventChip({ event }: { event: calendarEvent }) {
  const dotColor = CATEGORY_COLORS[event.category] ?? "var(--accent)";

  return (
    <div
      className="flex items-center justify-start gap-1 px-1 py-0.5 rounded bg-[rgba(128,128,128,0.08)] text-[0.75rem] cursor-pointer truncate hover:bg-[rgba(128,128,128,0.15)]"
      title={event.title}
      aria-description={event.description}
    >
      <span
        style={{ width: 7, height: 7, borderRadius: 2, background: dotColor, flexShrink: 0 }}
      />
      <strong className="truncate">
        {formatEventRange(event.startTimestampnz, event.endTimestampnz)}
      </strong>
      <span className="truncate">{event.title}</span>
    </div>
  );
}
