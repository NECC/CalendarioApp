"use client";
// Regista o service worker (public/sw.js), que recebe as notificações.

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((err) => console.error("[SW] falha no registo:", err));
  }, []);

  return null;
}
