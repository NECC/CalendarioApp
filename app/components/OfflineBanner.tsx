"use client";
// Banner shown when there is no internet. Dates come from the service worker cache.
import { useSyncExternalStore } from "react";

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
    () => navigator.onLine,
    () => true
  );

  if (online) return null;

  return (
    <div
      role="status"
      className="fixed top-0 inset-x-0 z-50 bg-foreground text-background text-xs text-center py-1.5 px-4"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.375rem)" }}
    >
      No connection. Showing the last saved dates.
    </div>
  );
}
