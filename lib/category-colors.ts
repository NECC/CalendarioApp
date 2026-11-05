// Fonte única das cores por categoria (antes estava duplicada em
// MonthGrid e EventCalendar).
export const CATEGORY_COLORS: Record<string, string> = {
  ano1: "#3B82F6", // Azul (1º Ano)
  ano2: "#10B981", // Verde (2º Ano)
  ano3: "#8B5CF6", // Roxo (3º Ano)
  eventos: "#111827", // Preto (Eventos gerais)
};

export const DEFAULT_CATEGORY_COLOR = "#3B82F6";

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? DEFAULT_CATEGORY_COLOR;
}
