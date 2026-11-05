// =============================================================
// Lógica dos avisos: corre nos crons (ver vercel.json).
//
// Há dois momentos por dia:
//
//  🌅 MANHÃ ("morning", ~7h em Lisboa)
//     - Testes com ⭐ que são HOJE → "Hoje: Cálculo - Teste. Boa sorte!"
//
//  🌆 TARDE ("evening", ~18h/19h em Lisboa)
//     - Testes com ⭐ que são daqui a 1 a 5 dias → "Faltam 3 dias: ..."
//     - Restantes testes dos filtros (sem ⭐):
//         amanhã            → "Amanhã: ..."
//         daqui a 7 dias    → "Daqui a uma semana: ..."
// =============================================================
import "server-only";
import { getCalendarEvents } from "./calendar-data";
import { filterEvents } from "./event-filters";
import { getAllSubscriptions } from "./push-store";
import { sendPush, type PushPayload } from "./push-send";
import type { calendarEvent } from "@/types/calendar";

export type NotifySlot = "morning" | "evening";

const TIME_ZONE = "Europe/Lisbon";
const STAR_DAYS_BEFORE = 5;

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

/** Aviso de um teste com estrela, `daysLeft` dias antes (0 = hoje). */
function starPayload(event: calendarEvent, daysLeft: number): PushPayload {
  const day = eventDay(event);
  const title =
    daysLeft === 0
      ? `⭐ Hoje: ${event.title}`
      : daysLeft === 1
        ? `⭐ Amanhã: ${event.title}`
        : `⭐ Faltam ${daysLeft} dias: ${event.title}`;
  const body =
    daysLeft === 0
      ? "Boa sorte! 🍀"
      : daysLeft === 1
        ? "Última revisão hoje. Bom estudo! 📚"
        : "Ainda vais a tempo de te preparar.";
  // A tag é a mesma todos os dias para este teste → o aviso de hoje
  // substitui o de ontem em vez de se acumularem 6 notificações.
  return { title, body, url: `/?date=${day}`, tag: `star-${event.id}` };
}

/** Aviso agrupado dos testes dos filtros (sem estrela). */
function groupPayload(events: calendarEvent[], day: string, when: "amanhã" | "semana"): PushPayload {
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

/** Decide que notificações uma pessoa recebe neste momento do dia. */
export function buildJobs(
  allEvents: calendarEvent[],
  prefs: { years?: number[]; subjects?: string[]; starred?: string[] },
  slot: NotifySlot,
  now = new Date(),
): PushPayload[] {
  const starredIds = new Set(prefs.starred ?? []);
  const starredEvents = allEvents.filter((e) => starredIds.has(e.id));
  const jobs: PushPayload[] = [];

  if (slot === "morning") {
    const today = lisbonDate(0, now);
    for (const e of starredEvents) {
      if (eventDay(e) === today) jobs.push(starPayload(e, 0));
    }
    return jobs;
  }

  // evening — testes com estrela, 1 a 5 dias antes
  for (let d = 1; d <= STAR_DAYS_BEFORE; d++) {
    const day = lisbonDate(d, now);
    for (const e of starredEvents) {
      if (eventDay(e) === day) jobs.push(starPayload(e, d));
    }
  }

  // evening — restantes testes dos filtros (os com estrela já têm aviso próprio)
  const mine = filterEvents(allEvents, prefs.years ?? [], prefs.subjects ?? []).filter(
    (e) => !starredIds.has(e.id),
  );
  const tomorrow = lisbonDate(1, now);
  const nextWeek = lisbonDate(7, now);
  const t = mine.filter((e) => eventDay(e) === tomorrow);
  if (t.length) jobs.push(groupPayload(t, tomorrow, "amanhã"));
  const w = mine.filter((e) => eventDay(e) === nextWeek);
  if (w.length) jobs.push(groupPayload(w, nextWeek, "semana"));

  return jobs;
}

export async function runNotifications(slot: NotifySlot, now = new Date()) {
  const allEvents = getCalendarEvents();
  const subs = await getAllSubscriptions();

  const stats = { slot, date: lisbonDate(0, now), subscriptions: subs.length, sent: 0, gone: 0, errors: 0 };

  // Envia em paralelo (Promise.allSettled: um erro não pára os outros).
  await Promise.allSettled(
    subs.map(async (sub) => {
      for (const payload of buildJobs(allEvents, sub, slot, now)) {
        const r = await sendPush(sub.subscription, payload);
        if (r === "ok") stats.sent++;
        else if (r === "gone") { stats.gone++; break; }
        else stats.errors++;
      }
    }),
  );

  return stats;
}
