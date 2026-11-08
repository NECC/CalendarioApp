// Decide que avisos enviar e envia-os. Corre uma vez por dia, a partir do cron.
// Cada pessoa recebe um aviso por cada teste com estrela que esteja a 7 dias ou
// menos, até ao próprio dia.
import "server-only";
import { getCalendarEvents } from "@/lib/calendar-data";
import { claimDelivery, getAllSubscriptions, releaseDelivery } from "@/lib/push/store";
import { sendPush, type PushPayload } from "@/lib/push/send";
import type { CalendarEvent } from "@/types/calendar";

const TIME_ZONE = "Europe/Lisbon";
export const DAYS_BEFORE = 7;
export const SEND_HOUR = 10;

/** Data "YYYY-MM-DD" em Lisboa, daqui a `offsetDays` dias. */
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

const eventDay = (e: CalendarEvent) => String(e.startTimestampnz).slice(0, 10);

/** "2026-11-08" passa a "Domingo, 8 de novembro". */
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

/** Texto do aviso: "Amanhã: Cálculo - Teste" e "Domingo, 8 de novembro". */
function starPayload(event: CalendarEvent, daysLeft: number): PushPayload {
  const day = eventDay(event);
  const prefix = daysLeft === 0 ? "Hoje" : daysLeft === 1 ? "Amanhã" : `Faltam ${daysLeft} dias`;
  return {
    title: `${prefix}: ${event.title}`,
    body: formatDay(day),
    url: `/?date=${day}`,
    // A tag muda todos os dias: o Safari não suporta `renotify`, por isso uma tag
    // repetida podia não alertar a pessoa.
    tag: `star-${event.id}-${daysLeft}`,
  };
}

/** Avisos que uma pessoa recebe hoje. */
export function buildJobs(
  allEvents: CalendarEvent[],
  starred: string[] = [],
  now = new Date(),
): PushPayload[] {
  const starredIds = new Set(starred);
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

/** Nome curto do serviço de push, para separar iPhone e Android no diagnóstico. */
function pushServiceName(endpoint: string): string {
  const host = new URL(endpoint).hostname;
  if (host.endsWith("push.apple.com")) return "apple";
  if (host.endsWith("googleapis.com")) return "google";
  if (host.endsWith("mozilla.com")) return "mozilla";
  return "outro";
}

/** Envia os avisos de hoje a todos os dispositivos e devolve um resumo do que aconteceu. */
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
    byService: {} as Record<string, { devices: number; sent: number; gone: number; errors: number }>,
  };

  const addError = (status: string) => {
    stats.errors++;
    stats.errorStatuses[status] = (stats.errorStatuses[status] ?? 0) + 1;
  };

  await Promise.all(
    subs.map(async (sub) => {
      const jobs = buildJobs(allEvents, sub.starred, now);
      if (jobs.length === 0) return;
      stats.withJobs++;

      const endpoint = sub.subscription.endpoint;
      const service = (stats.byService[pushServiceName(endpoint)] ??= { devices: 0, sent: 0, gone: 0, errors: 0 });
      service.devices++;
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
            service.sent++;
          } else if (r.outcome === "gone") {
            stats.gone++;
            service.gone++;
            break;
          } else {
            failed = true;
            service.errors++;
            addError(String(r.status ?? "sem-resposta"));
          }
        }
        // O próximo cron volta a tentar este dispositivo.
        if (failed && !force) await releaseDelivery(date, endpoint);
      } catch (err) {
        console.error("[notify] erro na subscrição:", err);
        service.errors++;
        addError("excecao");
        await releaseDelivery(date, endpoint).catch(() => {});
      }
    }),
  );

  return stats;
}
