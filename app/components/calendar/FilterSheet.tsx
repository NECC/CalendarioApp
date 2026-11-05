"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CATEGORY_COLORS } from "../../../lib/category-colors";
import { SUBJECTS_DATA } from "../../../lib/subjects";
import { NotificationSettings } from "./NotificationSettings";
import type { PushControls } from "@/hooks/usePushNotifications";

const YEARS = [
  {
    year: 1,
    label: "1º Ano",
    allLabel: "Todo o 1º ano",
    color: CATEGORY_COLORS.ano1,
  },
  {
    year: 2,
    label: "2º Ano",
    allLabel: "Todo o 2º ano",
    color: CATEGORY_COLORS.ano2,
  },
  {
    year: 3,
    label: "3º Ano",
    allLabel: "Todo o 3º ano",
    color: CATEGORY_COLORS.ano3,
  },
  {
    year: 0,
    label: "Eventos Gerais",
    allLabel: "Todos os eventos gerais",
    color: CATEGORY_COLORS.eventos,
  },
];

interface FilterSheetProps {
  /** Anos inteiros selecionados (0 = eventos gerais). */
  years: number[];
  /** Siglas das disciplinas selecionadas (de qualquer ano). */
  subjects: string[];
  resultCount: number;
  onToggleYear: (year: number) => void;
  onToggleSubject: (sigla: string) => void;
  onClear: () => void;
  onClose: () => void;
  push: PushControls;
}

const toggleIn = <T,>(list: T[], item: T) =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

function Chevron({
  open,
  className = "",
}: {
  open: boolean;
  className?: string;
}) {
  return (
    <svg
      className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""} ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/** Abre/fecha com animação de altura (grid 0fr -> 1fr), sem medir pixéis. */
function Collapsible({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
    >
      <div
        aria-hidden={!open}
        className={`min-h-0 overflow-hidden transition-[visibility] duration-300 ${
          open ? "visible" : "invisible"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function CheckRow({
  label,
  checked,
  onToggle,
  strong = false,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  strong?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="w-4 h-4 rounded border-border accent-primary"
      />
      <span className={`text-sm ${strong ? "font-bold" : "font-medium"}`}>
        {label}
      </span>
    </label>
  );
}

export function FilterSheet({
  years,
  subjects,
  resultCount,
  onToggleYear,
  onToggleSubject,
  onClear,
  onClose,
  push,
}: FilterSheetProps) {
  // Abre já expandidos os anos que têm seleção. Cada ano abre/fecha
  // de forma independente (não interfere com o que está selecionado).
  const [expandedYears, setExpandedYears] = useState<number[]>(() =>
    YEARS.map((y) => y.year).filter(
      (y) =>
        years.includes(y) ||
        SUBJECTS_DATA.some((s) => s.year === y && subjects.includes(s.sigla)),
    ),
  );
  const [expandedSemesters, setExpandedSemesters] = useState<string[]>([
    "1-1",
    "2-1",
    "3-1",
  ]);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Entrada/saída suaves: `shown` controla o translate e a opacidade do fundo.
  // Ao fechar, anima a saída e só depois pede ao pai para desmontar.
  const [shown, setShown] = useState(false);
  const closingRef = useRef(false);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => {
      cancelAnimationFrame(id);
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      onClose();
      return;
    }
    setShown(false);
    closeTimer.current = window.setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [requestClose]);

  const hasFilters = years.length > 0 || subjects.length > 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Filtros"
    >
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 motion-reduce:transition-none ${
          shown ? "opacity-100" : "opacity-0"
        }`}
        onClick={requestClose}
        aria-hidden="true"
      />
      <div
        className={`relative w-full max-w-lg mx-auto bg-background rounded-t-3xl border-t border-border shadow-2xl flex flex-col max-h-[85vh] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          shown ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b border-border/50 bg-background z-20 rounded-t-3xl">
          <h3 className="text-xl font-extrabold text-foreground tracking-tight">
            Filtros
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onClear}
              tabIndex={hasFilters ? 0 : -1}
              aria-hidden={!hasFilters}
              className={`text-sm font-semibold text-muted-foreground hover:text-foreground px-3 h-8 rounded-full transition-[color,opacity] duration-200 ${
                hasFilters ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              Limpar
            </button>
            <button
              ref={closeRef}
              onClick={requestClose}
              aria-label="Fechar filtros"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/20 text-foreground hover:bg-muted/40 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 pt-4 overflow-y-auto overscroll-contain flex flex-col">
          <NotificationSettings push={push} />

          {YEARS.map(({ year, label, allLabel, color }) => {
            const isExpanded = expandedYears.includes(year);
            const yearSubjects = SUBJECTS_DATA.filter((s) => s.year === year);
            const wholeYear = years.includes(year);
            const pickedCount = yearSubjects.filter((s) =>
              subjects.includes(s.sigla),
            ).length;

            const renderSubject = (sub: (typeof SUBJECTS_DATA)[number]) => (
              <CheckRow
                key={sub.sigla}
                label={sub.name}
                checked={wholeYear || subjects.includes(sub.sigla)}
                onToggle={() => onToggleSubject(sub.sigla)}
              />
            );

            return (
              <div
                key={year}
                className="border border-border rounded-2xl overflow-hidden bg-card mb-2 shrink-0"
              >
                <button
                  onClick={() =>
                    setExpandedYears((prev) => toggleIn(prev, year))
                  }
                  aria-expanded={isExpanded}
                  className="w-full flex items-center justify-between p-4 bg-muted/5 hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-bold text-foreground">{label}</span>
                    {(wholeYear || pickedCount > 0) && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent animate-in fade-in zoom-in-90 duration-200">
                        {wholeYear ? "Tudo" : pickedCount}
                      </span>
                    )}
                  </div>
                  <Chevron open={isExpanded} />
                </button>

                <Collapsible open={isExpanded}>
                  <div className="flex flex-col gap-3 pl-8 pr-4 py-4 border-t border-border/50 bg-background">
                    <CheckRow
                      strong
                      label={allLabel}
                      checked={wholeYear}
                      onToggle={() => onToggleYear(year)}
                    />

                    {year === 0 ? (
                      <div className="flex flex-col gap-3 pl-2 py-1 border-l-2 border-muted">
                        {yearSubjects.map(renderSubject)}
                      </div>
                    ) : (
                      [1, 2].map((sem) => {
                        const key = `${year}-${sem}`;
                        const semOpen = expandedSemesters.includes(key);
                        const semSubjects = yearSubjects.filter(
                          (s) => s.semester === sem,
                        );

                        return (
                          <div key={sem} className="flex flex-col">
                            <button
                              onClick={() =>
                                setExpandedSemesters((prev) =>
                                  toggleIn(prev, key),
                                )
                              }
                              aria-expanded={semOpen}
                              className="w-full flex items-center justify-between py-2 text-sm font-semibold"
                            >
                              <span className="text-muted-foreground">
                                {sem}º Semestre
                              </span>
                              <Chevron
                                open={semOpen}
                                className="text-muted-foreground"
                              />
                            </button>

                            <Collapsible open={semOpen}>
                              <div className="flex flex-col gap-3 pl-2 py-2 border-l-2 border-muted">
                                {semSubjects.map(renderSubject)}
                              </div>
                            </Collapsible>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Collapsible>
              </div>
            );
          })}

          <button
            onClick={requestClose}
            className="w-full mt-6 mb-4 h-12 shrink-0 bg-foreground text-background rounded-xl font-bold text-[15px] hover:opacity-90 active:scale-95 transition-transform"
          >
            Ver {resultCount} {resultCount === 1 ? "evento" : "eventos"}
          </button>
        </div>
      </div>
    </div>
  );
}
