// Colour of each category in the calendar and the filters.
export const CATEGORY_COLORS: Record<string, string> = {
  ano1: "#3B82F6", // blue
  ano2: "#10B981", // green
  ano3: "#8B5CF6", // purple
  eventos: "#111827", // black
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.ano1;
}
