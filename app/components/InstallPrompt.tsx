"use client";
// Android e Chrome/Edge disparam "beforeinstallprompt". No iPhone esse evento
// não existe, por isso mostramos as instruções de instalação.

import { useEffect, useState } from "react";

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
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {}
    if (standalone || dismissed) return;

    // O iPad recente identifica-se como "Macintosh", mas tem ecrã tátil.
    const ua = navigator.userAgent;
    const isIOS =
      /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setHidden(false);
    };
    const onInstalled = () => setHidden(true);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    const t = isIOS ? setTimeout(() => { setShowIOS(true); setHidden(false); }, 0) : undefined;

    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function fechar() {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  }

  async function instalar() {
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
        <p className="font-semibold">Instala o NECC Calendário</p>
        {showIOS ? (
          <p className="text-xs opacity-70">
            Toca em <b>Partilhar</b> e depois em{" "}
            <b>Adicionar ao ecrã principal</b> para receberes avisos dos testes.
          </p>
        ) : (
          <p className="text-xs opacity-70">Acesso rápido e avisos dos teus testes.</p>
        )}
      </div>
      {!showIOS && (
        <button
          onClick={instalar}
          className="shrink-0 bg-accent text-background font-semibold rounded-full px-3 py-1.5"
        >
          Instalar
        </button>
      )}
      <button onClick={fechar} aria-label="Fechar" className="shrink-0 opacity-60 px-1 text-lg leading-none">
        ×
      </button>
    </div>
  );
}
