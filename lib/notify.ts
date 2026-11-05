// =============================================================
// Lógica dos avisos — corre no cron diário (ver vercel.json).
//
// Só os testes com estrela ⭐ geram avisos:
//   - todos os dias às 10h (hora de Lisboa)
//   - desde 7 dias antes até ao próprio dia
//   - "Faltam 5 dias: Cálculo - Teste", "Amanhã: ...", "Hoje: ..."
// =============================================================
import "server-only";
import { getCalendarEvents } from "./calendar-data";
import { getAllSubscriptions } from "./push-store";
import { sendPush, type PushPayload } from "./push-send";
import type { calendarEvent } from "@/types/calendar";

const TIME_ZONE = "Europe/Lisbon";
/** Começa a avisar quantos dias antes do teste. */
export const DAYS_BEFORE = 7;
/** Hora (Lisboa) a que os avisos são enviados. */
export const SEND_HOUR = 10;

/** Data "YYYY-MM-DD" em Lisboa, `offsetDays` dias a partir de agora. */
export function lisbonDate(offsetDays = 0, now = new Date()): string {
  const d = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  // en-CA formata como YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(d);
}

/** Hora atual (0–23) em Lisboa — muda entre hora de inverno e de verão. */
export function lisbonHour(now = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, hour: "2-digit", hourCycle: "h23" }).format(now),
  );
}

const eventDay = (e: calendarEvent) => String(e.startTimestampnz).slice(0, 10);

/** "2026-11-08" → "domingo, 8 de novembro" */
function formatDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
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
        ? `É ${formatDay(day)}. Última revisão — bom estudo! 📚`
        : `É ${formatDay(day)}. Ainda vais a tempo de te preparar.`;
  // A tag é a mesma todos os dias para este teste → o aviso de hoje
  // substitui o de ontem em vez de se acumularem 8 notificações.
  return { title, body, url: `/?date=${day}`, tag: `star-${event.id}` };
}

/** Que avisos uma pessoa recebe hoje (um por cada teste com estrela a ≤ 7 dias). */
export function buildJobs(
  allEvents: calendarEvent[],
  prefs: { starred?: string[] },
  now = new Date(),
): PushPayload[] {
  const starredIds = new Set(prefs.starred ?? []);
  if (starredIds.size === 0) return [];

  const jobs: PushPayload[] = [];
  for (let d = 0; d <= DAYS_BEFORE; d++) {
    const day = lisbonDate(d, now);
    for (const e of allEvents) {
      if (starredIds.has(e.id) && eventDay(e) === day) jobs.push(starPayload(e, d));
    }
  }
  return jobs;
}

export async function runNotifications(now = new Date()) {
  const allEvents = getCalendarEvents();
  const subs = await getAllSubscriptions();

  const stats = { date: lisbonDate(0, now), subscriptions: subs.length, sent: 0, gone: 0, errors: 0 };

  // Envia em paralelo (Promise.allSettled: um erro não pára os outros).
  await Promise.allSettled(
    subs.map(async (sub) => {
      for (const payload of buildJobs(allEvents, sub, now)) {
        const r = await sendPush(sub.subscription, payload);
        if (r === "ok") stats.sent++;
        else if (r === "gone") { stats.gone++; break; }
        else stats.errors++;
      }
    }),
  );

  return stats;
}
