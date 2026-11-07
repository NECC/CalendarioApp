"use client";
// Home page: fetches the tests and shows the calendar.
import { useEffect, useState } from "react";
import { CalendarSkeleton } from "@/app/components/calendar/CalendarSkeleton";
import { EventCalendar } from "@/app/components/calendar/EventCalendar";
import type { CalendarEvent } from "@/types/calendar";

export default function Home() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch("/api/calendar");
        if (!res.ok) throw new Error("Failed to load data");
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
