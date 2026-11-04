"use client";

import type { Category } from "@/types/calendar";
import { useTranslation } from "@/lib/i18n-context";

interface CategoryFiltersProps {
  categories: Category[];
  selectedCategories: string[];
  onCategoryToggle: (categoryId: string) => void;
}

export function CategoryFilters({
  categories,
  selectedCategories,
  onCategoryToggle,
}: CategoryFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2 w-full text-foreground">
      <h2 className="text-lg font-bold px-1 mb-2">Filtros</h2>

      {categories.map((category) => {
        const isChecked = selectedCategories.includes(category.id);

        return (
          <div
            key={category.id}
            onClick={() => onCategoryToggle(category.id)}
            className="flex items-center justify-between p-3 rounded-2xl hover:bg-muted/10 cursor-pointer transition-colors border border-border/40 bg-card"
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => {}} // Gerido pelo clique no contentor principal
                className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
              />
              <span className="text-sm font-semibold">{t(category.name)}</span>
            </div>

            {category.color && (
              <span
                style={{ backgroundColor: category.color }}
                className="w-3 h-3 rounded-full shrink-0 shadow-xs"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
