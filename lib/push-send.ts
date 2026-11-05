// =============================================================
// Envio de notificações push (só servidor).
// =============================================================
import "server-only";
import webpush, { WebPushError, type PushSubscription } from "web-push";
import { deleteSubscription } from "./push-store";

let configured = false;

function configure() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("Faltam NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY nas variáveis de ambiente");
  }
  // O "subject" é um contacto para o push service (Google/Apple/Mozilla)
  // falar contigo se houver problemas com os teus envios.
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:necc@example.com",
    publicKey,
    privateKey,
  );
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  /** Página a abrir quando a pessoa toca na notificação. */
  url?: string;
  /** Notificações com a mesma tag substituem-se (evita duplicados). */
  tag?: string;
}

/**
 * Envia uma notificação. Devolve "gone" se a subscription já não existe
 * (a pessoa desinstalou a app / revogou a permissão) — nesse caso apagamo-la.
 */
export async function sendPush(
  subscription: PushSubscription,
  payload: PushPayload,
): Promise<"ok" | "gone" | "error"> {
  configure();
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload), {
      TTL: 60 * 60 * 12, // se o telemóvel estiver desligado, tenta entregar durante 12h
      urgency: "normal",
    });
    return "ok";
  } catch (err) {
    // 404/410 = esta "morada" já não existe → limpamos da base de dados.
    if (err instanceof WebPushError && (err.statusCode === 404 || err.statusCode === 410)) {
      await deleteSubscription(subscription.endpoint);
      return "gone";
    }
    console.error("[push] erro ao enviar:", err);
    return "error";
  }
}
