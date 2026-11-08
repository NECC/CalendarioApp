// Cor de cada categoria no calendário e nos filtros.
export const CATEGORY_COLORS: Record<string, string> = {
  ano1: "#3B82F6", // azul
  ano2: "#10B981", // verde
  ano3: "#8B5CF6", // roxo
  eventos: "#111827", // preto
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.ano1;
}
