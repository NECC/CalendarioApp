// Envia uma notificação a um dispositivo. Só corre no servidor.
import "server-only";
import webpush, { WebPushError, type PushSubscription } from "web-push";
import { deleteSubscription } from "@/lib/push/store";

// Em produção, o endereço da app. O formato declarativo exige um URL absoluto.
const APP_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

const SEND_TIMEOUT_MS = 10_000;

let configured = false;

function configure() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY ou VAPID_PRIVATE_KEY");
  }
  // O /api/push/health assinala este valor até haver um contacto real.
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:necc@example.com", publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  /** Página a abrir ao tocar na notificação. */
  url?: string;
  /** Notificações com a mesma tag substituem-se umas às outras. */
  tag?: string;
}

export interface PushResult {
  outcome: "ok" | "gone" | "error";
  /** Código HTTP devolvido pelo serviço de push, quando existe. */
  status?: number;
}

/**
 * Mensagem em dois formatos. Com "web_push": 8030 (Declarative Web Push), o iOS 18.4
 * ou mais recente mostra a notificação mesmo que o service worker falhe, e sem
 * o risco de a subscrição ser revogada. Os restantes browsers ignoram esse formato
 * e o service worker usa os campos simples.
 */
function buildMessage(payload: PushPayload): string {
  return JSON.stringify({
    web_push: 8030,
    notification: {
      title: payload.title,
      body: payload.body,
      navigate: new URL(payload.url ?? "/", APP_URL).href,
      tag: payload.tag,
      lang: "pt-PT",
    },
    ...payload,
  });
}

/** Se o serviço de push disser que o dispositivo já não existe, é removido da lista. */
export async function sendPush(subscription: PushSubscription, payload: PushPayload): Promise<PushResult> {
  try {
    configure();
    await webpush.sendNotification(subscription, buildMessage(payload), {
      TTL: 60 * 60 * 12, // se o telemóvel estiver desligado, tenta entregar durante 12 horas
      // Com "normal", o Android pode atrasar a entrega com o telemóvel em repouso.
      urgency: "high",
      // Sem limite, um serviço de push parado deixava o cron pendurado e sem resultado.
      timeout: SEND_TIMEOUT_MS,
    });
    return { outcome: "ok" };
  } catch (err) {
    const status = err instanceof WebPushError ? err.statusCode : undefined;
    if (status === 404 || status === 410) {
      await deleteSubscription(subscription.endpoint);
      return { outcome: "gone", status };
    }
    console.error("[push] falha no envio:", err);
    return { outcome: "error", status };
  }
}
