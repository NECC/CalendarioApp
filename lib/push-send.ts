import "server-only";
import webpush, { WebPushError, type PushSubscription } from "web-push";
import { deleteSubscription } from "./push-store";

let configured = false;

function configure() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("Faltam NEXT_PUBLIC_VAPID_PUBLIC_KEY ou VAPID_PRIVATE_KEY");
  }
  // /api/push/health assinala este valor de recurso até haver um contacto real.
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:necc@example.com", publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  /** Página a abrir ao tocar na notificação. */
  url?: string;
  /** Notificações com a mesma tag substituem-se. */
  tag?: string;
}

export interface PushResult {
  outcome: "ok" | "gone" | "error";
  /** Código HTTP devolvido pelo serviço de push, quando existe. */
  status?: number;
}

/** Envia uma notificação e apaga a subscrição se o serviço de push disser que já não existe. */
export async function sendPush(subscription: PushSubscription, payload: PushPayload): Promise<PushResult> {
  try {
    configure();
    await webpush.sendNotification(subscription, JSON.stringify(payload), {
      TTL: 60 * 60 * 12,
      // Com "normal", o Android pode atrasar a entrega enquanto o telemóvel está em repouso.
      urgency: "high",
    });
    return { outcome: "ok" };
  } catch (err) {
    const status = err instanceof WebPushError ? err.statusCode : undefined;
    if (status === 404 || status === 410) {
      await deleteSubscription(subscription.endpoint);
      return { outcome: "gone", status };
    }
    console.error("[push] erro ao enviar:", err);
    return { outcome: "error", status };
  }
}
