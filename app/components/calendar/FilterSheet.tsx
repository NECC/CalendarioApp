"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORY_COLORS } from "../../../lib/category-colors";
import { SUBJECTS_DATA, type YearFilter } from "../../../lib/subjects";

const YEARS = [
  { year: 1, label: "1º Ano", color: CATEGORY_COLORS.ano1 },
  { year: 2, label: "2º Ano", color: CATEGORY_COLORS.ano2 },
  { year: 3, label: "3º Ano", color: CATEGORY_COLORS.ano3 },
  { year: 0, label: "Eventos Gerais", color: CATEGORY_COLORS.eventos },
];

interface FilterSheetProps {
  year: YearFilter;
  subjects: string[];
  resultCount: number;
  onYearChange: (year: YearFilter) => void;
  onToggleSubject: (sigla: string) => void;
  onClear: () => void;
  onClose: () => void;
}

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

function SubjectCheckbox({
  name,
  checked,
  onToggle,
}: {
  name: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="w-4 h-4 rounded border-border accent-primary"
      />
      <span className="text-sm font-medium">{name}</span>
    </label>
  );
}

export function FilterSheet({
  year,
  subjects,
  resultCount,
  onYearChange,
  onToggleSubject,
  onClear,
  onClose,
}: FilterSheetProps) {
  // O painel só está montado enquanto aberto, por isso o estado inicial
  // reflete sempre o filtro ativo.
  const [expandedYear, setExpandedYear] = useState<number | null>(
    year === "all" ? null : year,
  );
  const [expandedSemester, setExpandedSemester] = useState<number | null>(1);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape fecha, bloqueia scroll do body e foca o botão de fechar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const toggleYear = (yearNum: number) => {
    if (expandedYear === yearNum) {
      setExpandedYear(null);
      onYearChange("all");
    } else {
      setExpandedYear(yearNum);
      onYearChange(yearNum);
    }
  };

  const hasFilters = year !== "all" || subjects.length > 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Filtros"
    >
      <div
        className="absolute inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg mx-auto bg-background rounded-t-3xl border-t border-border shadow-2xl animate-in slide-in-from-bottom-full duration-300 flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center p-6 border-b border-border/50 bg-background z-20 rounded-t-3xl">
          <h3 className="text-xl font-extrabold text-foreground tracking-tight">
            Filtros
          </h3>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <button
                onClick={onClear}
                className="text-sm font-semibold text-muted-foreground hover:text-foreground px-3 h-8 rounded-full transition-colors"
              >
                Limpar
              </button>
            )}
            <button
              ref={closeRef}
              onClick={onClose}
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
          {YEARS.map(({ year: yearNum, label, color }) => {
            const isExpanded = expandedYear === yearNum;
            const yearSubjects = SUBJECTS_DATA.filter(
              (s) => s.year === yearNum,
            );

            return (
              <div
                key={yearNum}
                className="border border-border rounded-2xl overflow-hidden bg-card mb-2 shrink-0"
              >
                <button
                  onClick={() => toggleYear(yearNum)}
                  aria-expanded={isExpanded}
                  className="w-full flex items-center justify-between p-4 bg-muted/5 hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-bold text-foreground">{label}</span>
                  </div>
                  <Chevron open={isExpanded} />
                </button>

                {isExpanded && yearNum !== 0 && (
                  <div className="flex flex-col pl-8 pr-4 py-2 border-t border-border/50 bg-background">
                    {[1, 2].map((sem) => {
                      const semExpanded = expandedSemester === sem;
                      const semSubjects = yearSubjects.filter(
                        (s) => s.semester === sem,
                      );

                      return (
                        <div key={sem} className="flex flex-col">
                          <button
                            onClick={() =>
                              setExpandedSemester(semExpanded ? null : sem)
                            }
                            aria-expanded={semExpanded}
                            className={`w-full flex items-center justify-between py-3 text-sm font-semibold ${sem === 2 ? "border-t border-border/30 mt-2" : ""}`}
                          >
                            <span className="text-muted-foreground">
                              {sem}º Semestre
                            </span>
                            <Chevron
                              open={semExpanded}
                              className="text-muted-foreground"
                            />
                          </button>

                          {semExpanded && (
                            <div className="flex flex-col gap-3 pl-2 py-2 mb-2 border-l-2 border-muted">
                              {semSubjects.map((sub) => (
                                <SubjectCheckbox
                                  key={sub.sigla}
                                  name={sub.name}
                                  checked={subjects.includes(sub.sigla)}
                                  onToggle={() => onToggleSubject(sub.sigla)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {isExpanded && yearNum === 0 && (
                  <div className="flex flex-col gap-3 pl-8 pr-4 py-4 border-t border-border/50 bg-background">
                    {yearSubjects.map((sub) => (
                      <SubjectCheckbox
                        key={sub.sigla}
                        name={sub.name}
                        checked={subjects.includes(sub.sigla)}
                        onToggle={() => onToggleSubject(sub.sigla)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={onClose}
            className="w-full mt-6 mb-4 h-12 shrink-0 bg-foreground text-background rounded-xl font-bold text-[15px] hover:opacity-90 active:scale-95 transition-transform"
          >
            Ver {resultCount} {resultCount === 1 ? "evento" : "eventos"}
          </button>
        </div>
      </div>
    </div>
  );
}
