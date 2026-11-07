// Sends a notification to a device. Only runs on the server.
import "server-only";
import webpush, { WebPushError, type PushSubscription } from "web-push";
import { deleteSubscription } from "@/lib/push/store";

let configured = false;

function configure() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY");
  }
  // /api/push/health flags this fallback until there is a real contact.
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:necc@example.com", publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  /** Page to open when the notification is tapped. */
  url?: string;
  /** Notifications with the same tag replace each other. */
  tag?: string;
}

export interface PushResult {
  outcome: "ok" | "gone" | "error";
  /** HTTP code returned by the push service, when there is one. */
  status?: number;
}

/** If the push service says the device no longer exists, it is removed from the list. */
export async function sendPush(subscription: PushSubscription, payload: PushPayload): Promise<PushResult> {
  try {
    configure();
    await webpush.sendNotification(subscription, JSON.stringify(payload), {
      TTL: 60 * 60 * 12, // if the phone is off, keep trying to deliver for 12 hours
      // With "normal", Android may delay delivery while the phone is idle.
      urgency: "high",
    });
    return { outcome: "ok" };
  } catch (err) {
    const status = err instanceof WebPushError ? err.statusCode : undefined;
    if (status === 404 || status === 410) {
      await deleteSubscription(subscription.endpoint);
      return { outcome: "gone", status };
    }
    console.error("[push] failed to send:", err);
    return { outcome: "error", status };
  }
}
