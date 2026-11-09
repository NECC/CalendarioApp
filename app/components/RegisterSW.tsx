"use client";
// Regista o service worker (public/sw.js), que recebe as notificações e guarda a app.

import { useEffect } from "react";

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

  return null;
}
