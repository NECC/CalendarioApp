"use client"

import { useState } from "react";
import { TopBar } from "./TopBar";
import { CategoryFilters } from "./CategoryFilters";
import { MonthGrid } from "./MonthGrid";
import type { calendarEvent, Category, CategoryId } from "@/types/calendar";
import { useTranslation } from "@/lib/i18n-context";

const CATEGORIES: Category[] = [
  { id: "event", name: "Calendar.categories.event", color: "#1E90FF" },
  { id: "exam", name: "Calendar.categories.exam", color: "#FF4500" },
];

const MONTH_KEYS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
] as const;

export function EventCalendar({ initialEvents = []}: {initialEvents ?: calendarEvent[]}) {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(() => new Date()) ;
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("all");

  const monthIndex = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const title = `${t(`Calendar.months.${MONTH_KEYS[monthIndex]}`)} ${year}`;

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  const toToday = () => setCurrentDate(new Date());

  const filteredEvents = selectedCategory === "all" ? initialEvents : initialEvents.filter((e) => e.category === selectedCategory);

  return (
    <div className="w-full p-6 bg-background text-foreground flex flex-col gap-5">
      <TopBar title={title} onPrev={prevMonth} onNext={nextMonth} onToday={toToday} />
      <CategoryFilters
        categories={CATEGORIES}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      <MonthGrid date={currentDate} events={filteredEvents} />
    </div >
  );
}

export function CalendarSkeleton() {
  return (
    <div className="w-full p-6 bg-background text-foreground flex flex-col gap-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 rounded-md bg-muted/40" />
        <div className="flex gap-2">
          <div className="h-9 w-20 rounded-md bg-muted/40" />
          <div className="h-9 w-9 rounded-md bg-muted/40" />
          <div className="h-9 w-9 rounded-md bg-muted/40" />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="h-8 w-16 rounded-full bg-muted/40" />
        <div className="h-8 w-20 rounded-full bg-muted/40" />
        <div className="h-8 w-20 rounded-full bg-muted/40" />
      </div>

      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={`header-${i}`} className="h-6 rounded bg-muted/30" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={`cell-${i}`} className="h-24 rounded-lg bg-muted/20" />
        ))}
      </div>
    </div>
  );
}
