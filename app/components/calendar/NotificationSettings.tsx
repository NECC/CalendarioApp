"use client";
// Secção "Avisos" no topo do ecrã de filtros: ligar/desligar e testar.
// Os avisos são só dos testes com estrela ⭐ (ver lib/notify.ts).

import type { PushControls } from "@/hooks/usePushNotifications";

interface Props {
  push: PushControls;
}

function BellIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function NotificationSettings({ push }: Props) {
  const { status, busy, message, enable, disable, sendTest } = push;

  let description: React.ReactNode;
  switch (status) {
    case "ios-not-installed":
      description = (
        <>
          No iPhone, instala primeiro a app: <b>Partilhar</b> → <b>Adicionar ao ecrã principal</b>, e abre-a a partir do ícone.
        </>
      );
      break;
    case "unsupported":
      description = "Este browser não suporta notificações. Experimenta o Chrome, Edge ou Firefox.";
      break;
    case "denied":
      description = "Bloqueaste as notificações. Para as ativar, muda a permissão nas definições do browser/telemóvel.";
      break;
    case "on":
      description = (
        <>
          Avisos ligados. Dá ⭐ a um teste na agenda e recebes um aviso <b>todos os dias às 10h</b>,
          desde uma semana antes até ao dia do teste.
        </>
      );
      break;
    default:
      description =
        "Dá ⭐ a um teste na agenda para receberes um aviso todos os dias às 10h, desde uma semana antes.";
  }

  const canToggle = status === "on" || status === "off";

  return (
    <div className="mb-4 shrink-0 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className={status === "on" ? "text-accent" : "text-muted-foreground"}>
          <BellIcon />
        </span>
        <span className="flex-1 font-bold text-foreground">Avisos dos testes</span>

        {canToggle && (
          // Interruptor (switch) acessível: role="switch" + aria-checked
          <button
            role="switch"
            aria-checked={status === "on"}
            aria-label="Avisos dos testes"
            disabled={busy}
            onClick={status === "on" ? disable : enable}
            className={`relative w-11 h-6 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
              status === "on" ? "bg-accent" : "bg-foreground/20"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                status === "on" ? "translate-x-5" : ""
              }`}
            />
          </button>
        )}
      </div>

      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{description}</p>

      {status === "on" && (
        <button
          onClick={sendTest}
          disabled={busy}
          className="mt-2 text-xs font-semibold text-accent underline underline-offset-2 disabled:opacity-50"
        >
          Enviar notificação de teste
        </button>
      )}

      {message && (
        <p role="status" className="mt-2 text-xs font-medium text-foreground">
          {message}
        </p>
      )}
    </div>
  );
}
