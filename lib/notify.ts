// =============================================================
// Lógica do aviso diário: corre no cron (/api/cron/notify).
// Para cada pessoa subscrita, procura os testes dos SEUS filtros que
// são amanhã ou daqui a 7 dias, e envia uma notificação.
// =============================================================
import "server-only";
import { getCalendarEvents } from "./calendar-data";
import { filterEvents } from "./event-filters";
import { getAllSubscriptions } from "./push-store";
import { sendPush, type PushPayload } from "./push-send";
import type { calendarEvent } from "@/types/calendar";

const TIME_ZONE = "Europe/Lisbon";

/** Data "YYYY-MM-DD" em Lisboa, `offsetDays` dias a partir de agora. */
export function lisbonDate(offsetDays = 0, now = new Date()): string {
  const d = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  // en-CA formata como YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(d);
}

const eventDay = (e: calendarEvent) => String(e.startTimestampnz).slice(0, 10);

/** "PF - Teste" → "PF (Teste)"; junta vários com vírgulas e "e". */
function describe(events: calendarEvent[]): string {
  const names = events.map((e) => e.title.replace(/ - (.+)$/, " ($1)"));
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} e ${names.at(-1)}`;
}

function buildPayload(events: calendarEvent[], day: string, when: "amanhã" | "semana"): PushPayload {
  const n = events.length;
  const title =
    when === "amanhã"
      ? n === 1 ? `Amanhã: ${events[0].title}` : `Amanhã tens ${n} avaliações`
      : n === 1 ? `Daqui a uma semana: ${events[0].title}` : `Daqui a uma semana: ${n} avaliações`;
  const body =
    when === "amanhã"
      ? `${describe(events)}. Bom estudo! 📚`
      : `${describe(events)}. Ainda vais a tempo de te preparar.`;
  return { title, body, url: `/?date=${day}`, tag: `${when}-${day}` };
}

export async function runDailyNotifications(now = new Date()) {
  const allEvents = getCalendarEvents();
  const subs = await getAllSubscriptions();

  const tomorrow = lisbonDate(1, now);
  const nextWeek = lisbonDate(7, now);

  const stats = { subscriptions: subs.length, sent: 0, gone: 0, errors: 0, tomorrow, nextWeek };

  // Envia em paralelo (mas Promise.allSettled não deixa um erro parar os outros).
  await Promise.allSettled(
    subs.map(async (sub) => {
      const mine = filterEvents(allEvents, sub.years ?? [], sub.subjects ?? []);
      const jobs: PushPayload[] = [];

      const t = mine.filter((e) => eventDay(e) === tomorrow);
      if (t.length) jobs.push(buildPayload(t, tomorrow, "amanhã"));

      const w = mine.filter((e) => eventDay(e) === nextWeek);
      if (w.length) jobs.push(buildPayload(w, nextWeek, "semana"));

      for (const payload of jobs) {
        const r = await sendPush(sub.subscription, payload);
        if (r === "ok") stats.sent++;
        else if (r === "gone") { stats.gone++; break; }
        else stats.errors++;
      }
    }),
  );

  return stats;
}
