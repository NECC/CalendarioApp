"use client";
// O calendário. Só abre na app instalada: no browser, manda a pessoa para "/", onde a instala.
// No computador (instalada ou não) vai para "/computador", que não tem estrelas.
import { CalendarSkeleton } from "@/app/components/calendar/CalendarSkeleton";
import { EventCalendar } from "@/app/components/calendar/EventCalendar";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { isDesktop, isInstalled } from "@/lib/device";

// Em desenvolvimento o calendário abre no browser, para se poder testar.
const BROWSER_ALLOWED = process.env.NODE_ENV === "development";

function stayHere() {
  if (BROWSER_ALLOWED) return true;
  // Mantém o ?date=, para uma notificação aberta no browser não perder o dia.
  if (isDesktop()) window.location.replace(`/computador${window.location.search}`);
  else if (!isInstalled()) window.location.replace(`/${window.location.search}`);
  else return true;
  return false;
}

export default function CalendarPage() {
  const { events, loading } = useCalendarEvents(stayHere);

  if (loading) return <CalendarSkeleton />;

  return (
    <main className="flex w-full h-dvh overflow-hidden">
      <EventCalendar events={events} />
    </main>
  );
}
