"use client";
// Registers the service worker (public/sw.js), which receives notifications.

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((err) => console.error("[SW] registration failed:", err));
  }, []);

  return null;
}
