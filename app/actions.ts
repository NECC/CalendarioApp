"use server";
// Funções do servidor que a app chama para gerir os avisos.
// Qualquer pessoa as pode chamar, por isso tudo o que chega é validado.
import type { PushSubscription } from "web-push";
import { getCalendarEvents } from "@/lib/calendar-data";
import { deleteSubscription, getSubscription, saveSubscription } from "@/lib/push/store";

const VALID_EVENT_IDS = new Set(getCalendarEvents().map((e) => e.id));
const MAX_STARS = 200;

/** Mantém só os IDs de testes que existem, sem repetidos. */
function cleanStarred(starred: unknown): string[] {
  if (!Array.isArray(starred)) return [];
  return [...new Set(starred.filter((id) => VALID_EVENT_IDS.has(id)))].slice(0, MAX_STARS);
}

// Serviços de push dos browsers (Chrome/Android, Safari/iPhone, Firefox, Edge).
// Sem esta lista, qualquer pessoa podia registar um URL seu e o servidor ia fazer
// pedidos para lá todos os dias.
const PUSH_SERVICE_HOSTS = ["googleapis.com", "push.apple.com", "mozilla.com", "notify.windows.com"];

function isPushServiceUrl(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    return (
      url.protocol === "https:" &&
      PUSH_SERVICE_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`))
    );
  } catch {
    return false;
  }
}

// As chaves reais têm 87 (p256dh) e 22 (auth) caracteres; isto só trava lixo gigante.
const MAX_KEY_LENGTH = 200;

function cleanSubscription(s: unknown): PushSubscription | null {
  const sub = s as PushSubscription | undefined;
  if (
    typeof sub?.endpoint !== "string" ||
    sub.endpoint.length > 1000 ||
    !isPushServiceUrl(sub.endpoint) ||
    typeof sub.keys?.p256dh !== "string" ||
    typeof sub.keys?.auth !== "string" ||
    sub.keys.p256dh.length > MAX_KEY_LENGTH ||
    sub.keys.auth.length > MAX_KEY_LENGTH
  ) {
    return null;
  }
  return { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } };
}

/** Regista o dispositivo e as suas estrelas. */
export async function subscribeUser(sub: unknown, starred: unknown) {
  const subscription = cleanSubscription(sub);
  if (!subscription) return { success: false as const, error: "Subscrição inválida" };
  await saveSubscription({ subscription, starred: cleanStarred(starred) });
  return { success: true as const };
}

/** Atualiza as estrelas de um dispositivo já registado. */
export async function updateStarred(endpoint: string, starred: unknown) {
  const existing = typeof endpoint === "string" ? await getSubscription(endpoint) : null;
  if (!existing) return { success: false as const, error: "Dispositivo não registado" };
  await saveSubscription({ subscription: existing.subscription, starred: cleanStarred(starred) });
  return { success: true as const };
}

/** Remove o dispositivo, para deixar de receber avisos. */
export async function unsubscribeUser(endpoint: string) {
  if (typeof endpoint === "string") await deleteSubscription(endpoint);
  return { success: true as const };
}

/** Chave pública de que o browser precisa para se registar no serviço de push. */
export async function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;
}
