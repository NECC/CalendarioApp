import type { Category, CategoryId } from "@/types/calendar";
import clsx from "clsx";
import { useTranslation } from "@/lib/i18n-context";

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
      <button
        type="button"
        className={clsx(
          "inline-flex items-center justify-center gap-1 px-3 py-[0.35rem] rounded-md border border-border text-[0.8rem] bg-transparent cursor-pointer",
          selectedCategory === "all" && "bg-accent text-background"
        )}
        onClick={() => onCategoryChange("all")}
      >
        {t("Calendar.all_categories", { count: categories.length })}
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          className={clsx(
            "inline-flex items-center justify-center gap-1 px-3 py-[0.35rem] rounded-md border border-border text-[0.8rem] bg-transparent cursor-pointer",
            selectedCategory === category.id && "bg-accent text-background"
          )}
          onClick={() => onCategoryChange(category.id)}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: category.color,
            }}
          />
          {t(category.name)}
        </button>
      ))}
    </div >
  );
}
