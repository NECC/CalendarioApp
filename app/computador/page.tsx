"use client";
// O calendário no computador: abre no browser, sem instalar, e não tem estrelas nem
// avisos. Em vez da estrela, cada teste leva ao material do curso no GitHub.
// No telemóvel, manda a pessoa para "/" (ou para a app, se estiver instalada).
import { CalendarSkeleton } from "@/app/components/calendar/CalendarSkeleton";
import { DesktopCalendar } from "@/app/components/calendar/EventCalendar";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { isDesktop, isInstalled } from "@/lib/device";

function stayHere() {
  if (isDesktop()) return true;
  const target = isInstalled() ? "/calendario" : "/";
  window.location.replace(`${target}${window.location.search}`);
  return false;
}

export default function DesktopPage() {
  const { events, loading } = useCalendarEvents(stayHere);

  if (loading) return <CalendarSkeleton desktop />;

  return (
    <main className="flex w-full h-dvh overflow-hidden">
      <DesktopCalendar events={events} />
    </main>
  );
}
