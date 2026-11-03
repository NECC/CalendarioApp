"use client";

import type { Category, CategoryId } from "@/types/calendar";
import { Button } from "@/app/components/ui/Button";
import { useTranslation } from "@/lib/i18n-context";
import { clsx } from "clsx";

interface CategoryFiltersProps {
  categories: Category[];
  selectedCategory: CategoryId;
  onCategoryChange: (categoryId: CategoryId) => void;
}

export function CategoryFilters({
  categories,
  selectedCategory,
  onCategoryChange,
}: CategoryFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant={selectedCategory === "all" ? "primary" : "outline"}
        size="sm"
        onClick={() => onCategoryChange("all")}
      >
        {t("Calendar.all_categories", { count: categories.length })}
      </Button>

      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "primary" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(category.id)}
          className="gap-1"
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: category.color,
            }}
            className="shrink-0"
          />
          {t(category.name)}
        </Button>
      ))}
    </div >
  );
}
