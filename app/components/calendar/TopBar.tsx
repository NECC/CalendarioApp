"use client";

import { useTheme } from "@/app/components/ui/ThemeContext";

interface TopBarProps {
  monthTitle: string;
  onPrev: () => void;
  onNext: () => void;
  onOpenSearch?: () => void;
}

export function TopBar({
  monthTitle,
  onPrev,
  onNext,
  onOpenSearch,
}: TopBarProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <div className="flex items-center justify-between w-full px-1 py-2">
      {/* Pílula do Mês com Ícone e Setas */}
      <div className="flex items-center bg-card border border-border rounded-full px-3.5 py-2 shadow-xs gap-3">
        <div className="flex items-center gap-2 text-foreground font-bold text-sm">
          <svg
            className="w-4 h-4 text-accent"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span className="tracking-tight">{monthTitle}</span>
        </div>

        <div className="flex items-center gap-1 border-l border-border pl-2.5">
          <button
            onClick={onPrev}
            className="w-6 h-6 rounded-full hover:bg-muted/20 flex items-center justify-center text-xs font-bold text-foreground transition-colors"
          >
            &lt;
          </button>
          <button
            onClick={onNext}
            className="w-6 h-6 rounded-full hover:bg-muted/20 flex items-center justify-center text-xs font-bold text-foreground transition-colors"
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Botões do Topo (Pesquisa e Tema) */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSearch}
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-muted/20 shadow-xs transition-transform active:scale-95"
          title="Pesquisar"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>

        <button
          onClick={toggleTheme}
          title="Mudar Tema"
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-muted/20 shadow-xs transition-transform active:scale-95"
        >
          {theme === "light" ? (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
