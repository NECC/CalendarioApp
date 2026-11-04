"use client";

import type { calendarEvent } from "@/types/calendar";

const CATEGORY_COLORS: Record<string, string> = {
  ano1: "#3B82F6", // Azul
  ano2: "#10B981", // Verde
  ano3: "#8B5CF6", // Roxo
  eventos: "#111827", // Preto
};

export function EventChip({ event }: { event: calendarEvent }) {
  // Assume a cor azul como padrão se a categoria não for encontrada
  const bgColor = CATEGORY_COLORS[event.category] ?? "#3B82F6";

  return (
    <div
      className="w-full px-2 py-1 mb-1 rounded text-white text-[0.75rem] font-medium text-center truncate cursor-pointer transition-opacity hover:opacity-80"
      style={{ backgroundColor: bgColor }}
      title={event.title}
      aria-description={event.description}
    >
      {event.title}
    </div>
  );
}
