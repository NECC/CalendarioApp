"use server";
// Server functions the app calls to manage reminders.
// Anyone can call these, so everything received is validated.
import type { PushSubscription } from "web-push";
import { getCalendarEvents } from "@/lib/calendar-data";
import { deleteSubscription, getSubscription, saveSubscription } from "@/lib/push/store";

const VALID_EVENT_IDS = new Set(getCalendarEvents().map((e) => e.id));
const MAX_STARS = 200;

/** Keeps only IDs of tests that exist, without duplicates. */
function cleanStarred(starred: unknown): string[] {
  if (!Array.isArray(starred)) return [];
  return [...new Set(starred.filter((id) => VALID_EVENT_IDS.has(id)))].slice(0, MAX_STARS);
}

function cleanSubscription(s: unknown): PushSubscription | null {
  const sub = s as PushSubscription | undefined;
  if (
    typeof sub?.endpoint !== "string" ||
    !sub.endpoint.startsWith("https://") ||
    sub.endpoint.length > 1000 ||
    typeof sub.keys?.p256dh !== "string" ||
    typeof sub.keys?.auth !== "string"
  ) {
    return null;
  }
  return { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } };
}

/** Registers the device and its stars. */
export async function subscribeUser(sub: unknown, starred: unknown) {
  const subscription = cleanSubscription(sub);
  if (!subscription) return { success: false as const, error: "Invalid subscription" };
  await saveSubscription({ subscription, starred: cleanStarred(starred) });
  return { success: true as const };
}

/** Updates the stars of a device that is already registered. */
export async function updateStarred(endpoint: string, starred: unknown) {
  const existing = typeof endpoint === "string" ? await getSubscription(endpoint) : null;
  if (!existing) return { success: false as const, error: "Device not registered" };
  await saveSubscription({ subscription: existing.subscription, starred: cleanStarred(starred) });
  return { success: true as const };
}

/** Removes the device, so it stops receiving reminders. */
export async function unsubscribeUser(endpoint: string) {
  if (typeof endpoint === "string") await deleteSubscription(endpoint);
  return { success: true as const };
}

/** Public key the browser needs to register with the push service. */
export async function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;
}
