"use client";

import type { calendarEvent } from "@/types/calendar";
import { getCategoryColor } from "../../../lib/category-colors";

export function EventChip({ event }: { event: calendarEvent }) {
  return (
    <div
      className="w-full px-2 py-1 mb-1 rounded text-white text-[0.75rem] font-medium text-center truncate cursor-pointer transition-opacity hover:opacity-80"
      style={{ backgroundColor: getCategoryColor(event.category) }}
      title={event.title}
      aria-description={event.description}
    >
      {event.title}
    </div>
  );
}
