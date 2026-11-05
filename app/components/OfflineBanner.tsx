"use client";
// Mostra um aviso quando a pessoa fica sem internet.
// Os dados que aparecem nesse caso vêm da cache do service worker (sw.js).

import { useSyncExternalStore } from "react";

// O browser dispara os eventos "online"/"offline" quando a ligação muda.
// useSyncExternalStore é a forma "oficial" do React de ler um valor que vive
// fora do React (aqui: navigator.onLine) e voltar a renderizar quando muda.
function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export function OfflineBanner() {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine, // valor no browser
    () => true // valor no servidor (lá não há navigator) — assumimos online
  );

  if (online) return null;

  return (
    <div
      role="status"
      className="fixed top-0 inset-x-0 z-50 bg-foreground text-background text-xs text-center py-1.5 px-4"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.375rem)" }}
    >
      Estás offline — a mostrar as últimas datas guardadas.
    </div>
  );
}
