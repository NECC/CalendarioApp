"use client";
// =============================================================
// Hook que trata de tudo o que é notificações do lado do browser:
//  - saber se o dispositivo suporta push (e porquê não, se não suportar)
//  - ativar (pedir permissão → subscrever → enviar ao servidor)
//  - desativar
//  - manter os filtros sincronizados com o servidor
// =============================================================
import { useCallback, useEffect, useState } from "react";
import {
  getVapidPublicKey,
  sendTestNotification,
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
  /** IDs dos testes com estrela ⭐ */
  starred: string[];
}

// A chave pública VAPID vem em "base64url", mas o browser quer bytes.
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

/** Espera pelo service worker, mas desiste ao fim de `ms` (senão ficava à espera para sempre). */
function swReady(ms = 8000): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("SW_TIMEOUT")), ms),
    ),
  ]);
}

/** A subscrição existente foi criada com esta chave VAPID? */
function sameKey(sub: PushSubscription, key: Uint8Array) {
  const current = sub.options?.applicationServerKey;
  if (!current) return true; // browser não diz → assumimos que sim
  const a = new Uint8Array(current);
  return a.length === key.length && a.every((v, i) => v === key[i]);
}

/** Traduz o erro técnico numa mensagem que a pessoa (e tu) percebem. */
function explainError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const name = err instanceof Error ? err.name : "";
  if (msg === "NO_VAPID_KEY")
    return "O servidor não tem a chave VAPID. Na Vercel: Settings → Environment Variables → adiciona NEXT_PUBLIC_VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY e faz Redeploy.";
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

export function usePushNotifications(prefs: PushPrefs) {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // 1) Ao abrir: verifica o suporte e se já havia subscrição.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let next: PushStatus;
      let sub: PushSubscription | null = null;

      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        // No iPhone, o Safari só expõe o PushManager quando a app está instalada.
        next = isIOS() && !isStandalone() ? "ios-not-installed" : "unsupported";
      } else if (Notification.permission === "denied") {
        next = "denied";
      } else {
        try {
          const reg = await swReady();
          sub = await reg.pushManager.getSubscription();
          next = sub ? "on" : "off";
        } catch (err) {
          // Mesmo sem SW mostramos o interruptor ("off"): ao carregar, o erro aparece explicado.
          console.error(err);
          next = "off";
        }
      }

      if (!cancelled) {
        setSubscription(sub);
        setStatus(next);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) Sempre que os filtros mudam e as notificações estão ativas
  //    (ou as estrelas), avisamos o servidor — com um pequeno atraso para
  //    juntar vários cliques seguidos num só pedido.
  const prefsKey = JSON.stringify(prefs);
  useEffect(() => {
    if (!subscription) return;
    const t = setTimeout(() => {
      updatePreferences(subscription.endpoint, JSON.parse(prefsKey)).then((r) => {
        // O servidor perdeu a subscrição (ex.: BD limpa) → voltamos a enviá-la.
        if (!r.success) subscribeUser(subscription.toJSON(), JSON.parse(prefsKey));
      });
    }, 600);
    return () => clearTimeout(t);
  }, [subscription, prefsKey]);

  const enable = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      // Tem de ser chamado dentro de um clique, senão o browser bloqueia o pedido.
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }

      // Chave do build; se não existir, pedimos ao servidor (ver getVapidPublicKey).
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || (await getVapidPublicKey());
      if (!key) throw new Error("NO_VAPID_KEY");
      const keyBytes = urlBase64ToUint8Array(key);

      const reg = await swReady();
      let sub = await reg.pushManager.getSubscription();
      // Uma subscrição antiga feita com OUTRA chave VAPID (ex.: chaves mudaram)
      // nunca vai receber nada → apagamos e criamos uma nova.
      if (sub && !sameKey(sub, keyBytes)) {
        await sub.unsubscribe();
        sub = null;
      }
      sub ??= await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes,
      });

      const r = await subscribeUser(sub.toJSON(), prefs);
      if (!r.success) throw new Error(`SERVER:${r.error}`);

      setSubscription(sub);
      setStatus("on");
    } catch (err) {
      console.error("[push] erro ao ativar:", err);
      setMessage(explainError(err));
    } finally {
      setBusy(false);
    }
  }, [prefs]);

  const disable = useCallback(async () => {
    if (!subscription) return;
    setBusy(true);
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

  const sendTest = useCallback(async () => {
    if (!subscription) return;
    setBusy(true);
    try {
      const r = await sendTestNotification(subscription.endpoint);
      setMessage(r.success ? "Enviada! Deve aparecer daqui a nada." : r.error);
    } finally {
      setBusy(false);
    }
  }, [subscription]);

  return { status, busy, message, enable, disable, sendTest };
}

export type PushControls = ReturnType<typeof usePushNotifications>;
