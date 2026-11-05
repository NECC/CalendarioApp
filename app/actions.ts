"use server";
// =============================================================
// Server Actions das notificações.
// "use server" = estas funções correm SÓ no servidor, mas o browser pode
// chamá-las como funções normais (o Next faz o pedido HTTP por trás).
//
// ⚠️ Qualquer pessoa na internet consegue chamar estas funções, por isso
// validamos SEMPRE o que chega (nunca confiar no cliente).
// =============================================================
import type { PushSubscription } from "web-push";
import { SUBJECTS_DATA } from "@/lib/subjects";
import {
  deleteSubscription,
  getSubscription,
  saveSubscription,
  type Preferences,
} from "@/lib/push-store";
import { sendPush } from "@/lib/push-send";

const VALID_YEARS = new Set([0, 1, 2, 3]);
const VALID_SUBJECTS = new Set(SUBJECTS_DATA.map((s) => s.sigla));

function cleanPreferences(p: unknown): Preferences {
  const obj = (p ?? {}) as Partial<Preferences>;
  const years = Array.isArray(obj.years)
    ? [...new Set(obj.years.filter((y) => VALID_YEARS.has(y)))]
    : [];
  const subjects = Array.isArray(obj.subjects)
    ? [...new Set(obj.subjects.filter((s) => VALID_SUBJECTS.has(s)))]
    : [];
  return { years, subjects };
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
  // Guardamos só os campos que interessam (ignora lixo extra).
  return { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } };
}

/** A pessoa ativou as notificações: guarda a "morada" + os filtros dela. */
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

/** A pessoa mudou os filtros: atualiza o que quer receber. */
export async function updatePreferences(endpoint: string, prefs: unknown) {
  const existing = typeof endpoint === "string" ? await getSubscription(endpoint) : null;
  if (!existing) return { success: false as const, error: "Não subscrito" };
  await saveSubscription({ ...existing, ...cleanPreferences(prefs) });
  return { success: true as const };
}

/** A pessoa desativou as notificações. */
export async function unsubscribeUser(endpoint: string) {
  if (typeof endpoint === "string") await deleteSubscription(endpoint);
  return { success: true as const };
}

/** Botão "Enviar teste": manda uma notificação só para este dispositivo. */
export async function sendTestNotification(endpoint: string) {
  const existing = typeof endpoint === "string" ? await getSubscription(endpoint) : null;
  if (!existing) return { success: false as const, error: "Não subscrito — volta a ativar" };

  const r = await sendPush(existing.subscription, {
    title: "NECC Calendário 🔔",
    body: "As notificações estão a funcionar! Vais ser avisado na véspera e uma semana antes.",
    url: "/",
    tag: "teste",
  });
  return r === "ok"
    ? { success: true as const }
    : { success: false as const, error: "Falhou o envio" };
}
