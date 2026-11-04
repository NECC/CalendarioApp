"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n-context";
import { Button } from "@/app/components/ui/Button";
import { useTheme } from "@/app/components/ui/ThemeContext";
import type { Category } from "@/types/calendar";

interface TopBarProps {
  title: string;
  onPrev: () => void;
  onNext: () => void;
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
}

export function TopBar({
  title,
  onPrev,
  onNext,
  categories,
  selectedCategory,
  onCategoryChange,
}: TopBarProps) {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const selectedCategoryName =
    selectedCategory === "all"
      ? "Todos os Anos / Eventos"
      : categories.find((c) => c.id === selectedCategory)?.name ||
        "Todos os Anos / Eventos";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Linha Superior: Logótipo com Imagem, Nome e Botão de Tema */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Imagem a vir da pasta public/icons/ (substitui 'logo.png' pelo nome do teu ficheiro) */}
          <div className="relative w-8 h-8 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-card border border-border shadow-xs">
            <Image
              src="/icons/necc-icon.svg"
              alt="NECC Logo"
              fill
              className="object-cover"
            />
          </div>
          <span className="font-bold text-base tracking-tight text-foreground">
            NECC Calendar
          </span>
        </div>

        <button
          onClick={toggleTheme}
          title={`Tema atual: ${theme}`}
          className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-muted/20 active:scale-95 transition-all shadow-xs"
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
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
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

      {/* Cartão Unificado: Mês/Ano e Setas */}
      <div className="flex items-center justify-between bg-card px-4 py-2.5 rounded-2xl border border-border shadow-xs">
        <h2 className="text-base font-bold tracking-tight text-foreground m-0">
          {title}
        </h2>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl h-8 w-9 p-0 border-border"
            onClick={onPrev}
          >
            &lt;
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl h-8 w-9 p-0 border-border"
            onClick={onNext}
          >
            &gt;
          </Button>
        </div>
      </div>

      {/* Seletor Personalizado */}
      <div className="relative w-full z-50" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full rounded-2xl bg-card border border-border h-12 text-sm px-4 flex items-center justify-between text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-accent shadow-xs cursor-pointer transition-all hover:border-accent/50"
        >
          <span>{selectedCategoryName}</span>
          <svg
            className={`w-4 h-4 text-foreground/40 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        {/* Lista de Opções com Fundo Sólido Absoluto */}
        {isOpen && (
          <div className="absolute left-0 right-0 mt-2 bg-background border-2 border-border rounded-2xl shadow-2xl overflow-hidden z-[999] py-1">
            <button
              type="button"
              onClick={() => {
                onCategoryChange("all");
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-accent/10 ${
                selectedCategory === "all"
                  ? "bg-accent/15 text-accent font-semibold"
                  : "text-foreground"
              }`}
            >
              Todos os Anos / Eventos
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onCategoryChange(cat.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-accent/10 flex items-center gap-2.5 ${
                  selectedCategory === cat.id
                    ? "bg-accent/15 text-accent font-semibold"
                    : "text-foreground"
                }`}
              >
                {cat.color && (
                  <span
                    style={{ backgroundColor: cat.color }}
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                  />
                )}
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
