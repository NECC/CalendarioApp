"use client";
// Painel de filtros que sobe a partir de baixo.
import { useState } from "react";
import { BottomSheet, SheetCloseButton } from "@/app/components/calendar/BottomSheet";
import { CATEGORY_COLORS } from "@/lib/category-colors";
import { SUBJECTS_DATA } from "@/lib/subjects";

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
  /** Códigos das UCs selecionadas, de qualquer ano. */
  subjects: string[];
  resultCount: number;
  onToggleYear: (year: number) => void;
  onToggleSubject: (code: string) => void;
  onClear: () => void;
  onClose: () => void;
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

/** Abre e fecha com animação de altura (grid 0fr para 1fr), sem medir pixéis. */
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
}: FilterSheetProps) {
  // Os anos com alguma seleção começam abertos.
  const [expandedYears, setExpandedYears] = useState<number[]>(() =>
    YEARS.map((y) => y.year).filter(
      (y) =>
        years.includes(y) ||
        SUBJECTS_DATA.some((s) => s.year === y && subjects.includes(s.code)),
    ),
  );
  const [expandedSemesters, setExpandedSemesters] = useState<string[]>([
    "1-1",
    "2-1",
    "3-1",
  ]);
  const hasFilters = years.length > 0 || subjects.length > 0;

  return (
    <BottomSheet
      title="Filtros"
      onClose={onClose}
      headerActions={
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
      }
    >
      <>
          {YEARS.map(({ year, label, allLabel, color }) => {
            const isExpanded = expandedYears.includes(year);
            const yearSubjects = SUBJECTS_DATA.filter((s) => s.year === year);
            const wholeYear = years.includes(year);
            const pickedCount = yearSubjects.filter((s) =>
              subjects.includes(s.code),
            ).length;

            const renderSubject = (sub: (typeof SUBJECTS_DATA)[number]) => (
              <CheckRow
                key={sub.code}
                label={sub.name}
                checked={wholeYear || subjects.includes(sub.code)}
                onToggle={() => onToggleSubject(sub.code)}
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
                        {wholeYear ? "Todas" : pickedCount}
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

          <SheetCloseButton
            className="w-full mt-6 h-12 shrink-0 bg-foreground text-background rounded-xl font-bold text-[15px] hover:opacity-90 active:scale-95 transition-transform"
          >
            Ver {resultCount} {resultCount === 1 ? "evento" : "eventos"}
          </SheetCloseButton>
      </>
    </BottomSheet>
  );
}
