"use client";
// Filtros do calendário, guardados no dispositivo: anos inteiros e UCs individuais.
import { useCallback, useEffect, useState } from "react";
import { SUBJECTS_DATA } from "@/lib/subjects";

const FILTERS_KEY = "necc-filters";

function load(): { years: number[]; subjects: string[] } {
  try {
    const saved = JSON.parse(localStorage.getItem(FILTERS_KEY) ?? "{}");
    return {
      years: Array.isArray(saved.years) ? saved.years : [],
      subjects: Array.isArray(saved.subjects) ? saved.subjects : [],
    };
  } catch {
    return { years: [], subjects: [] };
  }
}

export function useEventFilters() {
  const [years, setYears] = useState<number[]>(() => load().years);
  const [subjects, setSubjects] = useState<string[]>(() => load().subjects);

  useEffect(() => {
    try {
      localStorage.setItem(FILTERS_KEY, JSON.stringify({ years, subjects }));
    } catch {}
  }, [years, subjects]);

  /** Selecionar um ano inteiro substitui as UCs individuais desse ano. */
  const toggleYear = useCallback((year: number) => {
    setYears((prev) => (prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]));
    setSubjects((prev) =>
      prev.filter((code) => SUBJECTS_DATA.find((s) => s.code === code)?.year !== year),
    );
  }, []);

  const toggleSubject = useCallback(
    (code: string) => {
      const subject = SUBJECTS_DATA.find((s) => s.code === code);
      if (!subject) return;

      // Tirar uma UC de um ano inteiro: o ano deixa de estar selecionado
      // e passam a estar selecionadas todas as outras UCs desse ano.
      if (years.includes(subject.year)) {
        const others = SUBJECTS_DATA.filter((s) => s.year === subject.year && s.code !== code);
        setYears((prev) => prev.filter((y) => y !== subject.year));
        setSubjects((prev) => [...prev, ...others.map((s) => s.code)]);
        return;
      }

      setSubjects((prev) =>
        prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code],
      );
    },
    [years],
  );

  const clearFilters = useCallback(() => {
    setYears([]);
    setSubjects([]);
  }, []);

  return { years, subjects, toggleYear, toggleSubject, clearFilters };
}
