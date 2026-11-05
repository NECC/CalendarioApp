"use client";
// Testes marcados com estrela ⭐ — guardados no dispositivo (localStorage).
// Também são enviados ao servidor (ver usePushNotifications) para o cron
// saber de que testes avisar nos 5 dias antes e no próprio dia.

import { useCallback, useEffect, useMemo, useState } from "react";

const STARRED_KEY = "necc-starred";

function load(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STARRED_KEY) ?? "[]");
    return Array.isArray(saved) ? saved.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function useStarred() {
  // Só é usado em componentes que montam no cliente, por isso podemos ler já.
  const [starred, setStarred] = useState<string[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STARRED_KEY, JSON.stringify(starred));
    } catch {}
  }, [starred]);

  const toggleStar = useCallback((id: string) => {
    setStarred((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  // Set para procurar rápido ("este teste tem estrela?")
  const starredSet = useMemo(() => new Set(starred), [starred]);

  return { starred, starredSet, toggleStar };
}
