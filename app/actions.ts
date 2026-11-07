"use server";
// Estas funções são endpoints públicos: valida-se sempre o que chega do cliente.
import type { PushSubscription } from "web-push";
import { SUBJECTS_DATA } from "@/lib/subjects";
import { getCalendarEvents } from "@/lib/calendar-data";
import {
  deleteSubscription,
  getSubscription,
  saveSubscription,
  type Preferences,
} from "@/lib/push-store";

const VALID_YEARS = new Set([0, 1, 2, 3]);
const VALID_SUBJECTS = new Set(SUBJECTS_DATA.map((s) => s.sigla));
const VALID_EVENT_IDS = new Set(getCalendarEvents().map((e) => e.id));

function cleanPreferences(p: unknown): Preferences {
  const obj = (p ?? {}) as Partial<Preferences>;
  const years = Array.isArray(obj.years)
    ? [...new Set(obj.years.filter((y) => VALID_YEARS.has(y)))]
    : [];
  const subjects = Array.isArray(obj.subjects)
    ? [...new Set(obj.subjects.filter((s) => VALID_SUBJECTS.has(s)))]
    : [];
  const starred = Array.isArray(obj.starred)
    ? [...new Set(obj.starred.filter((id) => VALID_EVENT_IDS.has(id)))].slice(0, 200)
    : [];
  return { years, subjects, starred };
}

function cleanSubscription(s: unknown): PushSubscription | null {
  const sub = s as PushSubscription | undefined;
  if (
    !sub ||
    typeof sub.endpoint !== "string" ||
    !sub.endpoint.startsWith("https://") ||
    sub.endpoint.length > 1000 ||
    typeof sub.keys?.p256dh !== "string" ||
    typeof sub.keys?.auth !== "string"
  ) {
    return null;
  }
  return { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } };
}

export async function subscribeUser(sub: unknown, prefs: unknown) {
  const subscription = cleanSubscription(sub);
  if (!subscription) return { success: false as const, error: "Subscrição inválida" };

  const existing = await getSubscription(subscription.endpoint);
  await saveSubscription({
    subscription,
    ...cleanPreferences(prefs),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  });
  return { success: true as const };
}

export async function updatePreferences(endpoint: string, prefs: unknown) {
  const existing = typeof endpoint === "string" ? await getSubscription(endpoint) : null;
  if (!existing) return { success: false as const, error: "Não subscrito" };
  await saveSubscription({ ...existing, ...cleanPreferences(prefs) });
  return { success: true as const };
}

export async function unsubscribeUser(endpoint: string) {
  if (typeof endpoint === "string") await deleteSubscription(endpoint);
  return { success: true as const };
}

/** Chave pública em uso no servidor, para o browser detetar subscrições feitas com outra chave. */
export async function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;
}
