"use client";

import { useState } from "react";
import Image from "next/image";

const MONTH_ICON_SRC = "/icons/necc-icon.svg";

interface TopBarProps {
  monthTitle: string;
  onOpenFilters?: () => void;
  /** Nº de filtros ativos (mostra um contador no botão). */
  activeFilterCount?: number;
}

function MonthIcon() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <svg
        className="w-4 h-4 text-accent"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    );
  }
  return (
    <Image
      src={MONTH_ICON_SRC}
      alt=""
      width={22}
      height={22}
      unoptimized
      className="w-[22px] h-[22px] object-contain rounded-sm"
      onError={() => setFailed(true)}
    />
  );
}
export function TopBar({
  monthTitle,
  onOpenFilters,
  activeFilterCount = 0,
}: TopBarProps) {
  return (
    <div className="flex items-center justify-between w-full px-1 shrink-0">
      <div className="flex items-center h-10 bg-card border border-border rounded-full px-4 shadow-xs gap-2">
        <MonthIcon />
        <span className="text-foreground font-bold text-sm tracking-tight">
          {monthTitle}
        </span>
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
