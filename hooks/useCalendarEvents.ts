"use client";
// Carrega os eventos do calendário. `enabled` falso: não carrega (a página vai sair).
import { useEffect, useState } from "react";
import type { CalendarEvent } from "@/types/calendar";

export function useCalendarEvents(enabled: () => boolean) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled()) return;

    async function loadEvents() {
      try {
        const res = await fetch("/api/calendar");
        if (!res.ok) throw new Error("Falha ao carregar os dados");
        const data = await res.json();
        setEvents(data.events ?? []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só ao abrir a página
  }, []);

  return { events, loading };
}
