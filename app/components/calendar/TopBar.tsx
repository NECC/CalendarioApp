// Barra de topo: mês e ano, e botões dos avisos e dos filtros.
import { BellIcon } from "@/app/components/calendar/NotificationSettings";

interface TopBarProps {
  monthName: string;
  year: number;
  onOpenFilters: () => void;
  /** Número de filtros ativos, mostrado no botão. */
  activeFilterCount: number;
  onOpenNotifications: () => void;
  /** Testes com estrela que ainda vão acontecer, mostrado no botão. */
  upcomingStarredCount: number;
  /** Mostra o botão para voltar a hoje (quando o mês aberto não é o atual). */
  showToday: boolean;
  onGoToday: () => void;
}

const ROUND_BUTTON =
  "relative w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-muted/20 shadow-xs transition-transform active:scale-95";
const COUNT_BADGE =
  "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-[10px] font-bold text-white flex items-center justify-center";

export function TopBar({
  monthName,
  year,
  onOpenFilters,
  activeFilterCount,
  onOpenNotifications,
  upcomingStarredCount,
  showToday,
  onGoToday,
}: TopBarProps) {
  return (
    <div className="flex items-center justify-between w-full px-1 shrink-0">
      <div className="flex items-center">
      {/* Fora do mês atual, o botão aparece à esquerda e empurra o mês para o lado. */}
      <div
        inert={!showToday}
        className={`shrink-0 h-12 -my-1 flex items-center overflow-hidden transition-[width,margin,opacity] duration-300 ease-out motion-reduce:transition-none ${
          showToday ? "w-10 mr-2 opacity-100" : "w-0 mr-0 opacity-0"
        }`}
      >
        <button onClick={onGoToday} className={ROUND_BUTTON} title="Hoje" aria-label="Voltar a hoje">
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
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
            <circle cx="12" cy="16" r="1.5" fill="currentColor" />
          </svg>
        </button>
      </div>

      <div className="flex items-center h-10 bg-card border border-border rounded-full px-4 shadow-xs">
        <h1 className="text-foreground font-bold text-sm tracking-tight uppercase">
          {monthName} {year}
        </h1>
      </div>
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
