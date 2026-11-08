"use client";
// Lado do browser dos avisos: ligar e desligar, e enviar as estrelas para o servidor.
//
// Como funciona:
//  1. Dar uma estrela a um teste pede permissão e regista o dispositivo no servidor.
//  2. Sempre que as estrelas mudam, o servidor recebe a nova lista.
//  3. Às 10h, o servidor envia os avisos, mesmo com a app fechada.
import { useCallback, useEffect, useRef, useState } from "react";
import { getVapidPublicKey, subscribeUser, unsubscribeUser, updateStarred } from "@/app/actions";
import { isInstalled, isIOS } from "@/lib/device";

export type PushStatus =
  | "loading" // ainda a verificar
  | "unsupported" // o browser não suporta avisos
  | "ios-not-installed" // no iPhone, a app tem de estar instalada
  | "denied" // a pessoa bloqueou as notificações
  | "off" // desligados
  | "on"; // ligados

const OPT_OUT_KEY = "necc-push-off";
const SYNC_DELAY_MS = 600;
const SERVICE_WORKER_TIMEOUT_MS = 8000;

// ---- Preferência "desliguei os avisos": as estrelas deixam de os ligar ----

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

// ---- Auxiliares ----

function isSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/** O navigator.serviceWorker.ready pode nunca resolver, por isso há um limite de tempo. */
function serviceWorkerReady(): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("SW_TIMEOUT")), SERVICE_WORKER_TIMEOUT_MS),
    ),
  ]);
}

/** A chave VAPID vem em texto (base64url), mas o browser quer bytes. */
function keyToBytes(key: string) {
  const padding = "=".repeat((4 - (key.length % 4)) % 4);
  const base64 = (key + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(window.atob(base64), (c) => c.charCodeAt(0));
}

function usesKey(sub: PushSubscription, key: Uint8Array<ArrayBuffer>) {
  const current = sub.options?.applicationServerKey;
  if (!current) return true; // nem todos os browsers expõem a chave
  const bytes = new Uint8Array(current);
  return bytes.length === key.length && bytes.every((v, i) => v === key[i]);
}

/**
 * Devolve a subscrição do dispositivo, criando-a se for preciso.
 * Uma subscrição feita com outra chave nunca recebe nada, por isso é substituída.
 */
async function getOrCreateSubscription(reg: ServiceWorkerRegistration, key: Uint8Array<ArrayBuffer>) {
  const existing = await reg.pushManager.getSubscription();
  if (existing && usesKey(existing, key)) return existing;
  await existing?.unsubscribe();
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
}

/** Transforma um erro técnico numa mensagem para a pessoa. */
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
  if (msg.startsWith("SERVER:")) return `O servidor recusou: ${msg.slice(7)}`;
  return `Não foi possível ligar os avisos (${name || "erro"}: ${msg}).`;
}

// ---- O hook ----

export function usePushNotifications(starred: string[]) {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const starredRef = useRef(starred); // estrelas atuais, para usar dentro de activate()
  const activating = useRef(false); // impede duas ativações ao mesmo tempo
  const activationStarted = useRef(false); // a verificação inicial não pode substituir o resultado
  const permissionAsked = useRef(false); // a permissão só é pedida uma vez por sessão
  const vapidKey = useRef<string | null>(null); // obtida logo ao abrir, ver activate()

  useEffect(() => {
    starredRef.current = starred;
  }, [starred]);

  // Ao abrir a app: descobre o estado inicial dos avisos.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let next: PushStatus;
      let sub: PushSubscription | null = null;

      if (!isSupported()) {
        // No iPhone, os avisos só existem com a app instalada.
        next = isIOS() && !isInstalled() ? "ios-not-installed" : "unsupported";
      } else if (Notification.permission === "denied") {
        next = "denied";
      } else {
        try {
          const reg = await serviceWorkerReady();
          const key = await getVapidPublicKey();
          vapidKey.current = key;
          sub = await reg.pushManager.getSubscription();
          if (sub && key && Notification.permission === "granted") {
            sub = await getOrCreateSubscription(reg, keyToBytes(key));
          }
        } catch (err) {
          console.error("[push] falha ao verificar os avisos:", err);
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

  // Envia as estrelas para o servidor quando mudam, com um pequeno atraso para agrupar
  // vários toques. Repete ao sair e voltar à app, caso a app tenha sido fechada
  // logo depois de dar a estrela.
  const starredKey = JSON.stringify(starred);
  useEffect(() => {
    if (!subscription) return;
    const sync = async () => {
      try {
        const current = JSON.parse(starredKey);
        const updated = await updateStarred(subscription.endpoint, current);
        // Se o servidor não conhecer este dispositivo, regista-o outra vez.
        const result = updated.success ? updated : await subscribeUser(subscription.toJSON(), current);
        setSyncError(result.success ? null : result.error);
      } catch (err) {
        // Também acontece quando uma versão antiga da app fica aberta depois de um deploy.
        console.error("[push] falha ao sincronizar:", err);
        setSyncError("Não foi possível guardar as estrelas no servidor. Fecha e volta a abrir a app.");
      }
    };
    const timer = setTimeout(sync, SYNC_DELAY_MS);
    document.addEventListener("visibilitychange", sync);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [subscription, starredKey]);

  /** Pede permissão e regista o dispositivo. Sem permissão, tem de correr a partir de um toque. */
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

      // O Safari exige que a subscrição venha de um toque. Uma ida ao servidor
      // aqui podia fazer perder esse toque, por isso a chave já vem da abertura.
      const key = vapidKey.current ?? (await getVapidPublicKey());
      if (!key) throw new Error("NO_VAPID_KEY");

      const sub = await getOrCreateSubscription(await serviceWorkerReady(), keyToBytes(key));
      const result = await subscribeUser(sub.toJSON(), starredRef.current);
      if (!result.success) throw new Error(`SERVER:${result.error}`);

      setSubscription(sub);
      setStatus("on");
    } catch (err) {
      console.error("[push] falha ao ativar:", err);
      setMessage(explainError(err));
      setStatus((s) => (s === "loading" ? "off" : s));
    } finally {
      activating.current = false;
      setBusy(false);
    }
  }, []);

  /** Interruptor dos filtros: ligar. */
  const enable = useCallback(() => {
    setOptedOut(false);
    return activate();
  }, [activate]);

  /** Dar uma estrela liga os avisos, a não ser que a pessoa os tenha desligado. */
  const enableFromStar = useCallback(() => {
    if ((status === "off" || status === "loading") && isSupported() && !isOptedOut()) activate();
  }, [status, activate]);

  // Há estrelas mas os avisos estão desligados (por exemplo, estrelas de uma versão
  // antiga, ou o iOS perdeu a subscrição). Com permissão, liga já; sem ela, pede no
  // próximo toque. No iPhone, subscrever precisa sempre de um toque.
  const hasStars = starred.length > 0;
  useEffect(() => {
    if (status !== "off" || !hasStars || isOptedOut()) return;
    if (Notification.permission === "granted" && !isIOS()) {
      const timer = setTimeout(activate, 0);
      return () => clearTimeout(timer);
    }
    if (permissionAsked.current) return;
    document.addEventListener("click", activate, { once: true });
    return () => document.removeEventListener("click", activate);
  }, [status, hasStars, activate]);

  /** Interruptor dos filtros: desligar. */
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
