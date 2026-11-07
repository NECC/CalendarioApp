// Avisos dos testes com estrela: um por dia, às 10h em Lisboa, desde 7 dias
// antes até ao próprio dia.
import "server-only";
import { getCalendarEvents } from "./calendar-data";
import { claimDelivery, getAllSubscriptions, releaseDelivery } from "./push-store";
import { sendPush, type PushPayload } from "./push-send";
import type { calendarEvent } from "@/types/calendar";

const TIME_ZONE = "Europe/Lisbon";
export const DAYS_BEFORE = 7;
export const SEND_HOUR = 10;

/** Data "YYYY-MM-DD" em Lisboa, `offsetDays` dias a partir de agora. */
export function lisbonDate(offsetDays = 0, now = new Date()): string {
  const d = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(d);
}

/** Hora atual (0-23) em Lisboa. */
export function lisbonHour(now = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, hour: "2-digit", hourCycle: "h23" }).format(now),
  );
}

const eventDay = (e: calendarEvent) => String(e.startTimestampnz).slice(0, 10);

/** "2026-11-08" para "Domingo, 8 de novembro". */
function formatDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const text = new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function starPayload(event: calendarEvent, daysLeft: number): PushPayload {
  const day = eventDay(event);
  const prefix = daysLeft === 0 ? "Hoje" : daysLeft === 1 ? "Amanhã" : `Faltam ${daysLeft} dias`;
  return {
    title: `${prefix}: ${event.title}`,
    body: formatDay(day),
    url: `/?date=${day}`,
    // Tag fixa por teste: o aviso de hoje substitui o de ontem.
    tag: `star-${event.id}`,
  };
}

/** Avisos que uma pessoa recebe hoje. */
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

export async function runNotifications(now = new Date(), { force = false } = {}) {
  const allEvents = getCalendarEvents();
  const subs = await getAllSubscriptions();
  const date = lisbonDate(0, now);

  const stats = {
    date,
    subscriptions: subs.length,
    withStarred: subs.filter((s) => s.starred?.length).length,
    withJobs: 0,
    alreadySent: 0,
    sent: 0,
    gone: 0,
    errors: 0,
    errorStatuses: {} as Record<string, number>,
  };

  const addError = (status: string) => {
    stats.errors++;
    stats.errorStatuses[status] = (stats.errorStatuses[status] ?? 0) + 1;
  };

  await Promise.all(
    subs.map(async (sub) => {
      const jobs = buildJobs(allEvents, sub, now);
      if (jobs.length === 0) return;
      stats.withJobs++;

      const endpoint = sub.subscription.endpoint;
      try {
        if (!force && !(await claimDelivery(date, endpoint))) {
          stats.alreadySent++;
          return;
        }

        let failed = false;
        for (const payload of jobs) {
          const r = await sendPush(sub.subscription, payload);
          if (r.outcome === "ok") {
            stats.sent++;
          } else if (r.outcome === "gone") {
            stats.gone++;
            break;
          } else {
            failed = true;
            addError(String(r.status ?? "sem-resposta"));
          }
        }
        // Liberta o registo para a chamada seguinte voltar a tentar.
        if (failed && !force) await releaseDelivery(date, endpoint);
      } catch (err) {
        console.error("[notify] erro numa subscrição:", err);
        addError("excecao");
        await releaseDelivery(date, endpoint).catch(() => {});
      }
    }),
  );

  return stats;
}
