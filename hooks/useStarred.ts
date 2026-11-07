"use client";
// Testes com estrela, guardados no dispositivo e sincronizados com o servidor
// por usePushNotifications.

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
  const [starred, setStarred] = useState<string[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STARRED_KEY, JSON.stringify(starred));
    } catch {}
  }, [starred]);

  const toggleStar = useCallback((id: string) => {
    setStarred((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const starredSet = useMemo(() => new Set(starred), [starred]);

  return { starred, starredSet, toggleStar };
}
