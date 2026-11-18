"use client";
// Interruptor dos avisos no topo do painel dos avisos. Os avisos ligam-se sozinhos ao
// dar uma estrela a um teste; é aqui que se podem desligar.
import { BellIcon } from "@/app/components/icons";
import type { PushControls } from "@/hooks/usePushNotifications";

interface Props {
  push: PushControls;
}

export function NotificationSettings({ push }: Props) {
  const { status, checked, busy, message, syncError, enable, disable } = push;

  let description: React.ReactNode;
  switch (status) {
    case "ios-not-installed":
      description = (
        <>
          No iPhone, instala primeiro a app: toca em <b>Partilhar</b>, depois em <b>Adicionar ao ecrã principal</b>, e abre-a a partir do ícone.
        </>
      );
      break;
    case "unsupported":
      description = "Este browser não suporta notificações. Experimenta o Chrome, Edge ou Firefox.";
      break;
    case "denied":
      description = "Bloqueaste as notificações. Para as ativar, muda a permissão nas definições do browser ou do telemóvel.";
      break;
    case "on":
      description = (
        <>
          Recebes um aviso <b>todos os dias às 10h</b> dos testes com estrela, desde uma semana antes
          até ao dia do teste.
        </>
      );
      break;
    default:
      description =
        "Desligados. Liga-os para receberes um aviso todos os dias às 10h dos testes com estrela, desde uma semana antes.";
  }

  const canToggle = status === "on" || status === "off";

  return (
    <div className="mb-4 shrink-0 rounded-2xl border border-border p-4">
      <div className="flex items-center gap-3">
        <span className={status === "on" ? "text-accent" : ""}>
          <BellIcon />
        </span>
        <span className="flex-1 font-bold text-foreground">Avisos dos testes</span>

        {canToggle && (
          <button
            role="switch"
            aria-checked={checked}
            aria-label="Avisos dos testes"
            aria-busy={busy}
            disabled={busy}
            onClick={checked ? disable : enable}
            className={`relative w-11 h-6 shrink-0 rounded-full transition-colors ${
              checked ? "bg-accent" : "bg-foreground/20"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                checked ? "translate-x-5" : ""
              }`}
            />
          </button>
        )}
      </div>

      <p className="mt-2 text-xs leading-relaxed">{description}</p>

      {(syncError || message) && (
        <p role="status" className="mt-2 text-xs font-medium text-foreground">
          {syncError || message}
        </p>
      )}
    </div>
  );
}
