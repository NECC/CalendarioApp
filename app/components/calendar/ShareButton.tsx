"use client";
// Partilha um teste/evento usando o menu nativo do telemóvel
// (WhatsApp, Discord, Instagram, mensagens...) — a "Web Share API".
// Se o browser não suportar (ex.: Firefox no PC), copiamos o texto
// para a área de transferência em vez disso.

import { useState } from "react";
import type { calendarEvent } from "@/types/calendar";

export function ShareButton({ event }: { event: calendarEvent }) {
  const [copied, setCopied] = useState(false);

  async function partilhar() {
    const data = new Date(event.startTimestampnz).toLocaleDateString("pt-PT", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const texto = `📅 ${event.title}${event.description ? ` (${event.description})` : ""} — ${data}`;
    const url = window.location.origin;

    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, text: texto, url });
      } catch {
        // A pessoa fechou o menu sem partilhar — não é um erro, ignoramos.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(`${texto}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <button
      onClick={partilhar}
      aria-label={`Partilhar ${event.title}`}
      title={copied ? "Copiado!" : "Partilhar"}
      className="shrink-0 -mr-1 p-1 rounded-full opacity-70 hover:opacity-100 active:scale-90 transition"
    >
      {copied ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      )}
    </button>
  );
}
