"use client";

import { useState, useEffect } from "react";
import { EventCalendar } from "@/app/components/calendar/EventCalendar";
import { CalendarSkeleton } from "@/app/components/calendar/CalendarSkeleton";
import type { calendarEvent, Category } from "@/types/calendar";

export default function Home() {
  const [events, setEvents] = useState<calendarEvent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/calendar");
        if (!res.ok) throw new Error("Erro ao carregar dados");
        const data = await res.json();
        setEvents(data.events || []);
        setCategories(data.categories || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return <CalendarSkeleton />;
  }

  return (
    <main className="flex w-full h-dvh overflow-hidden">
      <EventCalendar initialEvents={events} initialCategories={categories} />
    </main>
  );
}
