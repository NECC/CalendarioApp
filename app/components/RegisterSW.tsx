"use client";
// Regista o service worker (public/sw.js), que recebe as notificações e guarda a app,
// e mantém a app atualizada.

import { useEffect } from "react";

const RELOADED_KEY = "necc-reloaded-for";

/**
 * No iPhone, abrir a app instalada só retoma a página que já lá estava: nunca a
 * recarrega, por isso uma versão nova nunca aparecia. Sempre que a app volta ao ecrã,
 * pergunta ao servidor qual é a versão atual e recarrega se for diferente.
 */
async function checkForUpdate() {
  if (document.visibilityState !== "visible" || !navigator.onLine) return;

  // Também vai buscar um sw.js novo, se o houver.
  navigator.serviceWorker?.getRegistration().then((reg) => reg?.update()).catch(() => {});

  try {
    const res = await fetch("/api/version", { cache: "no-store" });
    if (!res.ok) return;
    const { version } = await res.json();
    if (!version || version === process.env.APP_VERSION) return;

    // Só uma tentativa por versão: se a página voltar a vir antiga (rede lenta e a
    // cache do service worker responder primeiro), não fica a recarregar sem parar.
    if (sessionStorage.getItem(RELOADED_KEY) === version) return;
    sessionStorage.setItem(RELOADED_KEY, version);
    window.location.reload();
  } catch {
    // Sem ligação: fica para a próxima vez que a app abrir.
  }
}

export function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((err) => console.error("[SW] falha no registo:", err));

    // Na primeira visita a página carrega antes de o service worker existir, por isso
    // ele tem de saber que ficheiros guardar para a app abrir sem ligação.
    navigator.serviceWorker.ready.then((reg) => {
      const urls = performance.getEntriesByType("resource").map((entry) => entry.name);
      reg.active?.postMessage({ type: "precache", urls });
    });
  }, []);

  useEffect(() => {
    checkForUpdate();
    document.addEventListener("visibilitychange", checkForUpdate);
    window.addEventListener("online", checkForUpdate);
    return () => {
      document.removeEventListener("visibilitychange", checkForUpdate);
      window.removeEventListener("online", checkForUpdate);
    };
  }, []);

  return null;
}
