"use client";
// O calendário. Só abre na app instalada: no browser, manda a pessoa para "/", onde a instala.
import { useEffect, useState } from "react";
import { CalendarSkeleton } from "@/app/components/calendar/CalendarSkeleton";
import { EventCalendar } from "@/app/components/calendar/EventCalendar";
import { isInstalled } from "@/lib/device";
import type { CalendarEvent } from "@/types/calendar";

// Em desenvolvimento o calendário abre no browser, para se poder testar.
const BROWSER_ALLOWED = process.env.NODE_ENV === "development";

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!BROWSER_ALLOWED && !isInstalled()) {
      // Mantém o ?date=, para uma notificação aberta no browser não perder o dia.
      window.location.replace(`/${window.location.search}`);
      return;
    }

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
  }, []);

  if (loading) return <CalendarSkeleton />;

  return (
    <main className="flex w-full h-dvh overflow-hidden">
      <EventCalendar events={events} />
    </main>
  );
}
