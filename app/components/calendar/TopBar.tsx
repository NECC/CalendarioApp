// Barra de topo: nome do mês e botões dos avisos e dos filtros.
import Image from "next/image";
import { BellIcon } from "@/app/components/calendar/NotificationSettings";

interface TopBarProps {
  monthTitle: string;
  onOpenFilters: () => void;
  /** Número de filtros ativos, mostrado no botão. */
  activeFilterCount: number;
  onOpenNotifications: () => void;
  /** Testes com estrela que ainda vão acontecer, mostrado no botão. */
  upcomingStarredCount: number;
}

const ROUND_BUTTON =
  "relative w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-muted/20 shadow-xs transition-transform active:scale-95";
const COUNT_BADGE =
  "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-[10px] font-bold text-white flex items-center justify-center";

export function TopBar({
  monthTitle,
  onOpenFilters,
  activeFilterCount,
  onOpenNotifications,
  upcomingStarredCount,
}: TopBarProps) {
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

      <div className="flex items-center gap-2">
      <button
        onClick={onOpenNotifications}
        className={ROUND_BUTTON}
        title="Avisos"
        aria-label={
          upcomingStarredCount > 0 ? `Avisos (${upcomingStarredCount} testes com estrela)` : "Avisos"
        }
      >
        <BellIcon className="w-4 h-4" />
        {upcomingStarredCount > 0 && <span className={COUNT_BADGE}>{upcomingStarredCount}</span>}
      </button>

      <button
        onClick={onOpenFilters}
        className={ROUND_BUTTON}
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
          <span className={COUNT_BADGE}>{activeFilterCount}</span>
        )}
      </button>
      </div>
    </div>
  );
}
