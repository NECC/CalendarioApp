import { useTranslation } from "@/lib/i18n-context";

interface TopBarProps {
  title: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function TopBar({ title, onPrev, onNext, onToday }: TopBarProps) {
  const { t, locale, setLocale } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="inline-flex border border-border rounded-lg overflow-hidden">
          <button type="button" className="bg-accent font-semibold px-3.5 py-2 text-sm">
            {t("Calendar.monthly")}
          </button>
          <button type="button" className="px-3.5 py-2 text-sm">
            {t("Calendar.agenda")}
          </button>
        </div >
        <div className="inline-flex border border-border rounded-lg overflow-hidden">
          <button type="button" onClick={onPrev} className="px-3.5 py-2 text-sm">
            &lt;
          </button>
          <button type="button" onClick={onToday} className="px-3.5 py-2 text-sm">
            {t("Calendar.today")}
          </button>
          <button type="button" onClick={onNext} className="px-3.5 py-2 text-sm">
            &gt;
          </button>
        </div >
        <h2 className="text-xl m-0 font-bold">
          {title}
        </h2>
      </div >
      <div className="flex items-center gap-4">
        <input
          type="search"
          placeholder={t("Calendar.filter")}
          className="px-3 py-2 rounded-md border border-[rgba(128,128,128,0.25)] bg-transparent text-inherit text-sm"
        />
        <select 
          value={locale} 
          onChange={(e) => setLocale(e.target.value as any)}
          className="bg-transparent border border-border rounded p-1 text-sm"
        >
          <option value="en">EN</option>
          <option value="pt">PT</option>
        </select>
      </div >
    </div >
  );
}
