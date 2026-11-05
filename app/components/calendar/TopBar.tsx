"use client";

interface TopBarProps {
  monthTitle: string;
  onOpenFilters?: () => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  /** Nº de filtros ativos (mostra um contador no botão). */
  activeFilterCount?: number;
}

function ArrowButton({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={direction === "prev" ? "Mês anterior" : "Mês seguinte"}
      className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors active:scale-95"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <polyline
          points={direction === "prev" ? "15 18 9 12 15 6" : "9 18 15 12 9 6"}
        />
      </svg>
    </button>
  );
}

export function TopBar({
  monthTitle,
  onOpenFilters,
  onPrevMonth,
  onNextMonth,
  activeFilterCount = 0,
}: TopBarProps) {
  return (
    <div className="flex items-center justify-between w-full px-1 py-2">
      {/* Pílula do mês com setas (úteis em desktop, onde não há swipe) */}
      <div className="flex items-center bg-card border border-border rounded-full pl-1 pr-1 py-1 shadow-xs gap-1">
        <ArrowButton direction="prev" onClick={onPrevMonth} />
        <span className="text-foreground font-bold text-sm tracking-tight px-1 min-w-[9.5rem] text-center">
          {monthTitle}
        </span>
        <ArrowButton direction="next" onClick={onNextMonth} />
      </div>

      <button
        onClick={onOpenFilters}
        className="relative w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-muted/20 shadow-xs transition-transform active:scale-95"
        title="Filtros"
        aria-label={
          activeFilterCount > 0
            ? `Filtros (${activeFilterCount} ativos)`
            : "Filtros"
        }
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        {activeFilterCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-[10px] font-bold text-white flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </button>
    </div>
  );
}
