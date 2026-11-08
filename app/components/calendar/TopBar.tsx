// Barra de topo: nome do mês e botão dos filtros.
import Image from "next/image";

interface TopBarProps {
  monthTitle: string;
  onOpenFilters: () => void;
  /** Número de filtros ativos, mostrado no botão. */
  activeFilterCount: number;
}

export function TopBar({ monthTitle, onOpenFilters, activeFilterCount }: TopBarProps) {
  return (
    <div className="flex items-center justify-between w-full px-1 shrink-0">
      <div className="flex items-center h-10 bg-card border border-border rounded-full px-4 shadow-xs gap-2">
        <Image
          src="/icons/necc-icon.svg"
          alt=""
          width={22}
          height={22}
          unoptimized
          className="w-[22px] h-[22px] object-contain rounded-sm"
        />
        <span className="text-foreground font-bold text-sm tracking-tight">
          {monthTitle}
        </span>
      </div>

      <button
        onClick={onOpenFilters}
        className="relative w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-muted/20 shadow-xs transition-transform active:scale-95"
        title="Filtros"
        aria-label={activeFilterCount > 0 ? `Filtros (${activeFilterCount} ativos)` : "Filtros"}
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
