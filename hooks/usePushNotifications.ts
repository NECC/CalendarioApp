"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getVapidPublicKey,
  subscribeUser,
  unsubscribeUser,
  updatePreferences,
} from "@/app/actions";

export type PushStatus =
  | "loading" // ainda a verificar
  | "unsupported" // browser sem push
  | "ios-not-installed" // iPhone: só funciona com a app instalada
  | "denied" // a pessoa bloqueou as notificações
  | "off" // suportado, mas não ativo
  | "on"; // ativo

export interface PushPrefs {
  years: number[];
  subjects: string[];
  /** IDs dos testes com estrela. */
  starred: string[];
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function isIOS() {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** navigator.serviceWorker.ready nunca rejeita, por isso impomos um limite. */
function swReady(ms = 8000): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("SW_TIMEOUT")), ms),
    ),
  ]);
}

function sameKey(sub: PushSubscription, key: Uint8Array) {
  const current = sub.options?.applicationServerKey;
  if (!current) return true; // nem todos os browsers expõem a chave
  const a = new Uint8Array(current);
  return a.length === key.length && a.every((v, i) => v === key[i]);
}

function explainError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const name = err instanceof Error ? err.name : "";
  if (msg === "NO_VAPID_KEY")
    return "O servidor não tem a chave VAPID. Na Vercel, adiciona NEXT_PUBLIC_VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY às variáveis de ambiente e faz redeploy.";
  if (msg === "SW_TIMEOUT")
    return "O service worker não arrancou. Recarrega a página; se continuar, vê a consola (F12).";
  if (/push service|registration failed|AbortError/i.test(msg) || name === "AbortError")
    return "O browser recusou o registo no serviço de push. No Brave, ativa \"Usar serviços Google para mensagens push\" em brave://settings/privacy. Noutros browsers, confirma que não estás em modo anónimo.";
  if (name === "NotAllowedError")
    return "As notificações estão bloqueadas para este site. Desbloqueia no cadeado ao lado do endereço.";
  if (msg.startsWith("SERVER:"))
    return `O servidor recusou: ${msg.slice(7)}`;
  return `Não foi possível ativar (${name || "erro"}: ${msg}).`;
}

const OPT_OUT_KEY = "necc-push-off";

/** A pessoa desligou os avisos: as estrelas deixam de os ligar sozinhas. */
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

function isSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function usePushNotifications(prefs: PushPrefs) {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const prefsRef = useRef(prefs);
  const activating = useRef(false);
  const started = useRef(false);
  const asked = useRef(false);

  useEffect(() => {
    prefsRef.current = prefs;
  }, [prefs]);

  // Estado inicial. Uma subscrição feita com outra chave VAPID nunca recebe nada:
  // como a permissão já foi dada, renovamo-la sem pedir nada à pessoa.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let next: PushStatus;
      let sub: PushSubscription | null = null;

      if (!isSupported()) {
        // No iPhone, o PushManager só existe com a app instalada.
        next = isIOS() && !isStandalone() ? "ios-not-installed" : "unsupported";
      } else if (Notification.permission === "denied") {
        next = "denied";
      } else {
        try {
          const reg = await swReady();
          sub = await reg.pushManager.getSubscription();
          if (sub && Notification.permission === "granted") {
            const key = await getVapidPublicKey();
            const keyBytes = key ? urlBase64ToUint8Array(key) : null;
            if (keyBytes && !sameKey(sub, keyBytes)) {
              await sub.unsubscribe();
              sub = null;
              sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: keyBytes,
              });
            }
          }
          next = sub ? "on" : "off";
        } catch (err) {
          // Mostramos o interruptor na mesma: ao ligar, o erro aparece explicado.
          console.error(err);
          next = sub ? "on" : "off";
        }
      }

      // Se a pessoa já deu uma estrela entretanto, activate() trata do estado.
      if (!cancelled && !started.current) {
        setSubscription(sub);
        setStatus(next);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Sincroniza estrelas e filtros com o servidor. Repete ao sair e voltar à app:
  // cobre quem fecha logo a seguir a dar estrela e as apps que ficam abertas em
  // segundo plano. Se o servidor não conhecer o dispositivo, regista-o de novo.
  const prefsKey = JSON.stringify(prefs);
  useEffect(() => {
    if (!subscription) return;
    const sync = async () => {
      try {
        const nextPrefs = JSON.parse(prefsKey);
        const updated = await updatePreferences(subscription.endpoint, nextPrefs);
        const r = updated.success ? updated : await subscribeUser(subscription.toJSON(), nextPrefs);
        setSyncError(r.success ? null : r.error);
      } catch (err) {
        // Uma versão antiga da app aberta depois de um deploy também falha aqui.
        console.error("[push] erro ao sincronizar:", err);
        setSyncError("Não foi possível guardar as estrelas no servidor. Fecha e volta a abrir a app.");
      }
    };
    const t = setTimeout(sync, 600);
    document.addEventListener("visibilitychange", sync);
    return () => {
      clearTimeout(t);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [subscription, prefsKey]);

  const activate = useCallback(async () => {
    if (activating.current) return;
    activating.current = true;
    started.current = true;
    setBusy(true);
    setMessage(null);
    try {
      // Sem permissão, tem de correr dentro de um toque, senão o browser bloqueia.
      if (Notification.permission === "default") asked.current = true;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }

      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || (await getVapidPublicKey());
      if (!key) throw new Error("NO_VAPID_KEY");
      const keyBytes = urlBase64ToUint8Array(key);

      const reg = await swReady();
      let sub = await reg.pushManager.getSubscription();
      if (sub && !sameKey(sub, keyBytes)) {
        await sub.unsubscribe();
        sub = null;
      }
      sub ??= await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes,
      });

      const r = await subscribeUser(sub.toJSON(), prefsRef.current);
      if (!r.success) throw new Error(`SERVER:${r.error}`);

      setSubscription(sub);
      setStatus("on");
    } catch (err) {
      console.error("[push] erro ao ativar:", err);
      setMessage(explainError(err));
      setStatus((s) => (s === "loading" ? "off" : s));
    } finally {
      activating.current = false;
      setBusy(false);
    }
  }, []);

  /** Interruptor nos filtros. */
  const enable = useCallback(() => {
    setOptedOut(false);
    return activate();
  }, [activate]);

  /** Dar estrela liga os avisos, a menos que a pessoa os tenha desligado. */
  const enableFromStar = useCallback(() => {
    if ((status === "off" || status === "loading") && isSupported() && !isOptedOut()) activate();
  }, [status, activate]);

  // Estrelas sem avisos ligados (por exemplo, dadas antes desta versão). Com
  // permissão, liga já; sem ela, pede uma vez no toque seguinte.
  const hasStars = prefs.starred.length > 0;
  useEffect(() => {
    if (status !== "off" || !hasStars || isOptedOut()) return;
    if (Notification.permission === "granted") {
      const t = setTimeout(activate, 0);
      return () => clearTimeout(t);
    }
    if (asked.current) return;
    document.addEventListener("click", activate, { once: true });
    return () => document.removeEventListener("click", activate);
  }, [status, hasStars, activate]);

  const disable = useCallback(async () => {
    if (!subscription) return;
    setBusy(true);
    setOptedOut(true);
    try {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await unsubscribeUser(endpoint);
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
