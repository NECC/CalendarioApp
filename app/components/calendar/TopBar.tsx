"use client";

import { useTranslation } from "@/lib/i18n-context";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { ThemeSwitcher } from "@/app/components/ui/ThemeSwitcher";

interface TopBarProps {
  title: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function TopBar({ title, onPrev, onNext, onToday }: TopBarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="inline-flex border border-border rounded-lg overflow-hidden">
          <Button variant="primary" size="sm" className="rounded-none border-none">
            {t("Calendar.monthly")}
          </Button>
          <Button variant="ghost" size="sm" className="rounded-none border-none">
            {t("Calendar.agenda")}
          </Button>
        </div >
        <div className="inline-flex border border-border rounded-lg overflow-hidden">
          <Button variant="ghost" size="sm" className="rounded-none border-none" onClick={onPrev}>
            &lt;
          </Button>
          <Button variant="ghost" size="sm" className="rounded-none border-none" onClick={onToday}>
            {t("Calendar.today")}
          </Button>
          <Button variant="ghost" size="sm" className="rounded-none border-none" onClick={onNext}>
            &gt;
          </Button>
        </div >
        <h2 className="text-xl m-0 font-bold">
          {title}
        </h2>
      </div >
      <div className="flex items-center gap-4">
        <Input
          type="search"
          placeholder={t("Calendar.filter")}
          className="w-48"
        />
        <ThemeSwitcher />
      </div >
    </div >
  );
}
