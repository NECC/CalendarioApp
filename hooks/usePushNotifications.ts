"use client";
// Browser side of reminders: turning them on and off, and sending stars to the server.
//
// How it works:
//  1. Starring a test asks for permission and registers the device on the server.
//  2. Whenever the stars change, the server receives the new list.
//  3. At 10:00, the server sends the reminders, even with the app closed.
import { useCallback, useEffect, useRef, useState } from "react";
import { getVapidPublicKey, subscribeUser, unsubscribeUser, updateStarred } from "@/app/actions";
import { isInstalled, isIOS } from "@/lib/device";

export type PushStatus =
  | "loading" // still checking
  | "unsupported" // the browser does not support reminders
  | "ios-not-installed" // on iPhone, the app must be installed
  | "denied" // the person blocked notifications
  | "off" // turned off
  | "on"; // turned on

const OPT_OUT_KEY = "necc-push-off";
const SYNC_DELAY_MS = 600;
const SERVICE_WORKER_TIMEOUT_MS = 8000;

// ---- "I turned reminders off" preference: stars no longer turn them on ----

function isOptedOut() {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

function setOptedOut(value: boolean) {
  try {
    if (value) localStorage.setItem(OPT_OUT_KEY, "1");
    else localStorage.removeItem(OPT_OUT_KEY);
  } catch {}
}

// ---- Helpers ----

function isSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/** navigator.serviceWorker.ready may never resolve, so a time limit applies. */
function serviceWorkerReady(): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("SW_TIMEOUT")), SERVICE_WORKER_TIMEOUT_MS),
    ),
  ]);
}

/** The VAPID key comes as text (base64url), but the browser wants bytes. */
function keyToBytes(key: string) {
  const padding = "=".repeat((4 - (key.length % 4)) % 4);
  const base64 = (key + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(window.atob(base64), (c) => c.charCodeAt(0));
}

function usesKey(sub: PushSubscription, key: Uint8Array<ArrayBuffer>) {
  const current = sub.options?.applicationServerKey;
  if (!current) return true; // not every browser exposes the key
  const bytes = new Uint8Array(current);
  return bytes.length === key.length && bytes.every((v, i) => v === key[i]);
}

/**
 * Returns the device's subscription, creating it if needed.
 * A subscription made with another key never receives anything, so it is replaced.
 */
async function getOrCreateSubscription(reg: ServiceWorkerRegistration, key: Uint8Array<ArrayBuffer>) {
  const existing = await reg.pushManager.getSubscription();
  if (existing && usesKey(existing, key)) return existing;
  await existing?.unsubscribe();
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
}

/** Turns a technical error into a message for the person. */
function explainError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const name = err instanceof Error ? err.name : "";
  if (msg === "NO_VAPID_KEY")
    return "The server has no VAPID key. On Vercel, add NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to the environment variables and redeploy.";
  if (msg === "SW_TIMEOUT")
    return "The service worker did not start. Reload the page; if this continues, check the console (F12).";
  if (/push service|registration failed|AbortError/i.test(msg) || name === "AbortError")
    return "The browser refused to register with the push service. In Brave, turn on \"Use Google services for push messaging\" in brave://settings/privacy. In other browsers, make sure you are not in private mode.";
  if (name === "NotAllowedError")
    return "Notifications are blocked for this site. Unblock them from the padlock next to the address.";
  if (msg.startsWith("SERVER:")) return `The server refused: ${msg.slice(7)}`;
  return `Could not turn on reminders (${name || "error"}: ${msg}).`;
}

// ---- The hook ----

export function usePushNotifications(starred: string[]) {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const starredRef = useRef(starred); // current stars, for use inside activate()
  const activating = useRef(false); // prevents two activations at once
  const activationStarted = useRef(false); // the initial check must not overwrite the result
  const permissionAsked = useRef(false); // permission is only asked once per session

  useEffect(() => {
    starredRef.current = starred;
  }, [starred]);

  // When the app opens: find out the initial state of reminders.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let next: PushStatus;
      let sub: PushSubscription | null = null;

      if (!isSupported()) {
        // On iPhone, reminders only exist with the app installed.
        next = isIOS() && !isInstalled() ? "ios-not-installed" : "unsupported";
      } else if (Notification.permission === "denied") {
        next = "denied";
      } else {
        try {
          const reg = await serviceWorkerReady();
          sub = await reg.pushManager.getSubscription();
          if (sub && Notification.permission === "granted") {
            const key = await getVapidPublicKey();
            if (key) sub = await getOrCreateSubscription(reg, keyToBytes(key));
          }
        } catch (err) {
          console.error("[push] failed to check reminders:", err);
          sub = null;
        }
        next = sub ? "on" : "off";
      }

      if (!cancelled && !activationStarted.current) {
        setSubscription(sub);
        setStatus(next);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Sends the stars to the server when they change, with a short delay to group
  // several taps. Repeats when leaving and returning to the app, in case the app
  // was closed right after starring.
  const starredKey = JSON.stringify(starred);
  useEffect(() => {
    if (!subscription) return;
    const sync = async () => {
      try {
        const current = JSON.parse(starredKey);
        const updated = await updateStarred(subscription.endpoint, current);
        // If the server does not know this device, register it again.
        const result = updated.success ? updated : await subscribeUser(subscription.toJSON(), current);
        setSyncError(result.success ? null : result.error);
      } catch (err) {
        // This also happens when an old version of the app stays open after a deploy.
        console.error("[push] failed to sync:", err);
        setSyncError("Could not save your stars on the server. Close and reopen the app.");
      }
    };
    const timer = setTimeout(sync, SYNC_DELAY_MS);
    document.addEventListener("visibilitychange", sync);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [subscription, starredKey]);

  /** Asks for permission and registers the device. Without permission, it must run from a tap. */
  const activate = useCallback(async () => {
    if (activating.current) return;
    activating.current = true;
    activationStarted.current = true;
    setBusy(true);
    setMessage(null);
    try {
      if (Notification.permission === "default") permissionAsked.current = true;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }

      const key = await getVapidPublicKey();
      if (!key) throw new Error("NO_VAPID_KEY");

      const sub = await getOrCreateSubscription(await serviceWorkerReady(), keyToBytes(key));
      const result = await subscribeUser(sub.toJSON(), starredRef.current);
      if (!result.success) throw new Error(`SERVER:${result.error}`);

      setSubscription(sub);
      setStatus("on");
    } catch (err) {
      console.error("[push] failed to activate:", err);
      setMessage(explainError(err));
      setStatus((s) => (s === "loading" ? "off" : s));
    } finally {
      activating.current = false;
      setBusy(false);
    }
  }, []);

  /** Filters switch: turn on. */
  const enable = useCallback(() => {
    setOptedOut(false);
    return activate();
  }, [activate]);

  /** Starring turns reminders on, unless the person turned them off. */
  const enableFromStar = useCallback(() => {
    if ((status === "off" || status === "loading") && isSupported() && !isOptedOut()) activate();
  }, [status, activate]);

  // There are stars but reminders are off (for example, stars from an old
  // version). With permission, turn on now; without it, ask on the next tap.
  const hasStars = starred.length > 0;
  useEffect(() => {
    if (status !== "off" || !hasStars || isOptedOut()) return;
    if (Notification.permission === "granted") {
      const timer = setTimeout(activate, 0);
      return () => clearTimeout(timer);
    }
    if (permissionAsked.current) return;
    document.addEventListener("click", activate, { once: true });
    return () => document.removeEventListener("click", activate);
  }, [status, hasStars, activate]);

  /** Filters switch: turn off. */
  const disable = useCallback(async () => {
    if (!subscription) return;
    setBusy(true);
    setOptedOut(true);
    try {
      await subscription.unsubscribe();
      await unsubscribeUser(subscription.endpoint);
      setSubscription(null);
      setStatus("off");
      setMessage(null);
    } finally {
      setBusy(false);
    }
  }, [subscription]);

  return { status, busy, message, syncError, enable, enableFromStar, disable };
}

export type PushControls = ReturnType<typeof usePushNotifications>;
