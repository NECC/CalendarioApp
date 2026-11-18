"use client";
// Botão para instalar a app. O Android e o Chrome/Edge têm o seu próprio pedido de
// instalação. O iPhone não tem, por isso mostra as instruções.

import { useEffect, useState } from "react";
import { isIOS } from "@/lib/device";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    /** Pedido de instalação apanhado pelo <script> da página, antes de o React arrancar. */
    __installPrompt?: BeforeInstallPromptEvent | null;
  }
}

/** Ainda a ver o que o browser permite, iPhone, botão, instalada, ou sem pedido. */
type State = "checking" | "ios" | "prompt" | "installed" | "manual";

export function InstallButton() {
  const [state, setState] = useState<State>("checking");
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // setTimeout: o estado só pode mudar depois do primeiro render (regra do React).
    if (isIOS()) {
      const t = setTimeout(() => setState("ios"), 0);
      return () => clearTimeout(t);
    }

    const show = (e: BeforeInstallPromptEvent) => {
      setPrompt(e);
      setState("prompt");
    };
    const early = window.__installPrompt;
    const t0 = early ? setTimeout(() => show(early), 0) : undefined;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      show(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setPrompt(null);
      setState("installed");
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // Sem pedido do browser (já instalada, ou um browser que não instala): instruções.
    const t = setTimeout(() => setState((s) => (s === "checking" ? "manual" : s)), 1500);

    return () => {
      clearTimeout(t0);
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    // O pedido só se pode usar uma vez.
    window.__installPrompt = null;
    setPrompt(null);
    setState(outcome === "accepted" ? "installed" : "manual");
  }

  if (state === "checking") {
    // Guarda o espaço do botão, para a página não saltar.
    return <div className="h-14" aria-hidden="true" />;
  }

  if (state === "prompt") {
    return (
      <button
        onClick={install}
        className="h-14 w-full sm:w-auto px-8 rounded-full bg-accent text-white text-base font-bold shadow-lg shadow-accent/25 transition-transform active:scale-95"
      >
        Instalar a app
      </button>
    );
  }

  if (state === "installed") {
    return (
      <Box>
        <p className="font-semibold">Está instalada!</p>
        <p className="opacity-75">Abre o NECCalendário a partir do ecrã principal.</p>
      </Box>
    );
  }

  if (state === "ios") {
    return (
      <Box>
        <p className="font-semibold mb-2">Para instalar no iPhone:</p>
        <ol className="space-y-1.5 list-decimal list-inside opacity-85">
          <li>
            Toca em <b>Partilhar</b> <ShareIcon />
          </li>
          <li>
            Escolhe <b>Adicionar ao ecrã principal</b>
          </li>
          <li>
            Abre o <b>NECCalendário</b> a partir do ecrã principal
          </li>
        </ol>
      </Box>
    );
  }

  return (
    <Box>
      <p className="font-semibold mb-1">Para instalar:</p>
      <p className="opacity-75">
        No menu do browser, escolhe <b>Instalar app</b> ou <b>Adicionar ao ecrã principal</b>. Se
        não aparecer, abre este site no Chrome (Android) ou no Safari (iPhone).
      </p>
      <p className="opacity-75 mt-2">Se já a instalaste, abre-a a partir do ecrã principal.</p>
    </Box>
  );
}

function Box({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full text-left text-sm p-4 rounded-2xl border border-border bg-accent/5">
      {children}
    </div>
  );
}

function ShareIcon() {
  return (
    <svg
      className="inline w-4 h-4 -mt-1 text-accent"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="(o quadrado com a seta para cima)"
    >
      <path d="M12 3v12M7 8l5-5 5 5" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  );
}
