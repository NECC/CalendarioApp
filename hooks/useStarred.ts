"use client";
// Testes com estrela, guardados no dispositivo.
// O usePushNotifications envia esta lista para o servidor.
// As estrelas dos testes que já passaram saem sozinhas: ao abrir a app e sempre que
// volta ao ecrã (no iPhone a app pode ficar dias aberta sem recarregar).
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CalendarEvent } from "@/types/calendar";

const STARRED_KEY = "necc-starred";

function load(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STARRED_KEY) ?? "[]");
    return Array.isArray(saved) ? saved.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** IDs dos testes de antes de hoje. Os de hoje ficam, porque ainda recebem o aviso. */
function pastEventIds(events: CalendarEvent[]): Set<string> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return new Set(events.filter((e) => new Date(e.startTimestampnz) < today).map((e) => e.id));
}

/** Tira as estrelas dos testes passados. Devolve a mesma lista se não houver nada a tirar. */
function withoutPast(starred: string[], events: CalendarEvent[]): string[] {
  const past = pastEventIds(events);
  const kept = starred.filter((id) => !past.has(id));
  return kept.length === starred.length ? starred : kept;
}

export function useStarred(events: CalendarEvent[]) {
  const [starred, setStarred] = useState<string[]>(() => withoutPast(load(), events));

  useEffect(() => {
    try {
      localStorage.setItem(STARRED_KEY, JSON.stringify(starred));
    } catch {}
  }, [starred]);

  useEffect(() => {
    const prune = () => {
      if (document.visibilityState === "visible") setStarred((prev) => withoutPast(prev, events));
    };
    document.addEventListener("visibilitychange", prune);
    return () => document.removeEventListener("visibilitychange", prune);
  }, [events]);

  const toggleStar = useCallback((id: string) => {
    setStarred((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const starredSet = useMemo(() => new Set(starred), [starred]);

  return { starred, starredSet, toggleStar };
}
