"use client";
// Secção "Avisos" no topo do ecrã de filtros.
// As notificações usam os MESMOS filtros que o calendário:
// o que vês no calendário é aquilo de que és avisado.

import { usePushNotifications } from "@/hooks/usePushNotifications";

interface Props {
  years: number[];
  subjects: string[];
}

function BellIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function NotificationSettings({ years, subjects }: Props) {
  const { status, busy, message, enable, disable, sendTest } = usePushNotifications({ years, subjects });
  const hasFilters = years.length > 0 || subjects.length > 0;

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
      description = hasFilters
        ? "Recebes aviso na véspera e uma semana antes das avaliações selecionadas abaixo."
        : "Recebes aviso de TODAS as avaliações. Seleciona as tuas UCs abaixo para receberes só essas.";
      break;
    default:
      description = "Recebe um aviso na véspera e uma semana antes dos teus testes e entregas.";
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
