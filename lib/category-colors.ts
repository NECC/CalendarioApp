// Cor de cada categoria no calendário e nos filtros.
import type { CSSProperties } from "react";

export const CATEGORY_COLORS: Record<string, string> = {
  ano1: "#3B82F6", // azul
  ano2: "#10B981", // verde
  ano3: "#8B5CF6", // roxo
  eventos: "#111827", // preto
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.ano1;
}

/** Fundo e texto de uma linha de evento, tingidos com a cor da categoria. */
export function eventRowStyle(color: string): CSSProperties {
  return {
    backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
    color: `color-mix(in srgb, ${color} 70%, var(--foreground))`,
  };
}
