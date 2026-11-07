// Decides which reminders to send and sends them. Runs once a day, from the cron.
// Each person gets one reminder for each starred test that is 7 days away or
// less, up to the day itself.
import "server-only";
import { getCalendarEvents } from "@/lib/calendar-data";
import { claimDelivery, getAllSubscriptions, releaseDelivery } from "@/lib/push/store";
import { sendPush, type PushPayload } from "@/lib/push/send";
import type { CalendarEvent } from "@/types/calendar";

const TIME_ZONE = "Europe/Lisbon";
export const DAYS_BEFORE = 7;
export const SEND_HOUR = 10;

/** Date "YYYY-MM-DD" in Lisbon, `offsetDays` days from now. */
export function lisbonDate(offsetDays = 0, now = new Date()): string {
  const d = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(d);
}

/** Current hour (0-23) in Lisbon. */
export function lisbonHour(now = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, hour: "2-digit", hourCycle: "h23" }).format(now),
  );
}

const eventDay = (e: CalendarEvent) => String(e.startTimestampnz).slice(0, 10);

/** "2026-11-08" becomes "Sunday 8 November". */
function formatDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

/** Reminder text: "Tomorrow: Cálculo - Test" and "Sunday 8 November". */
function starPayload(event: CalendarEvent, daysLeft: number): PushPayload {
  const day = eventDay(event);
  const prefix = daysLeft === 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft} days left`;
  return {
    title: `${prefix}: ${event.title}`,
    body: formatDay(day),
    url: `/?date=${day}`,
    // Fixed tag per test: today's reminder replaces yesterday's.
    tag: `star-${event.id}`,
  };
}

/** Reminders a person gets today. */
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

/** Sends today's reminders to every device and returns a summary of what happened. */
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
      const jobs = buildJobs(allEvents, sub.starred, now);
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
            addError(String(r.status ?? "no-response"));
          }
        }
        // The next cron retries this device.
        if (failed && !force) await releaseDelivery(date, endpoint);
      } catch (err) {
        console.error("[notify] subscription error:", err);
        addError("exception");
        await releaseDelivery(date, endpoint).catch(() => {});
      }
    }),
  );

  return stats;
}
