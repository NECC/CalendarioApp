"use client";
// Invitation to install the app. Android and Chrome/Edge have their own install
// prompt. The iPhone does not, so it shows instructions instead.

import { useEffect, useState } from "react";
import { isInstalled, isIOS } from "@/lib/device";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "install-dismissed";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {}
    if (isInstalled() || dismissed) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setHidden(false);
    };
    const onInstalled = () => setHidden(true);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    const t = isIOS() ? setTimeout(() => { setShowIOS(true); setHidden(false); }, 0) : undefined;

    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setHidden(true);
  }

  if (hidden) return null;

  return (
    <div className="fixed top-3 inset-x-3 z-40 mx-auto max-w-md flex items-center gap-3 p-3 rounded-2xl border border-border bg-background shadow-lg text-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/necc-icon-192.png" alt="" className="w-10 h-10 rounded-xl" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold">Install NECC Calendar</p>
        {showIOS ? (
          <p className="text-xs opacity-70">
            Tap <b>Share</b>, then{" "}
            <b>Add to Home Screen</b> to get test reminders.
          </p>
        ) : (
          <p className="text-xs opacity-70">Quick access and reminders for your tests.</p>
        )}
      </div>
      {!showIOS && (
        <button
          onClick={install}
          className="shrink-0 bg-accent text-background font-semibold rounded-full px-3 py-1.5"
        >
          Install
        </button>
      )}
      <button onClick={dismiss} aria-label="Close" className="shrink-0 opacity-60 px-1 text-lg leading-none">
        ×
      </button>
    </div>
  );
}
