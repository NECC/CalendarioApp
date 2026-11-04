"use client";

import { useState, useEffect } from "react";
import { TopBar } from "./TopBar";
import { MonthGrid } from "./MonthGrid";
import { CalendarSkeleton } from "./CalendarSkeleton";
import type { calendarEvent, Category } from "@/types/calendar";

const MONTH_KEYS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

interface EventCalendarProps {
  initialEvents?: calendarEvent[];
  initialCategories?: Category[];
}

export function EventCalendar({
  initialEvents = [],
  initialCategories = [],
}: EventCalendarProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const [categories] = useState<Category[]>(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    setCurrentDate(new Date());
    setIsMounted(true);
  }, []);

  if (!isMounted) return <CalendarSkeleton />;

  const monthIndex = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const title = `${MONTH_KEYS[monthIndex].toUpperCase()} ${year}`;

  const prevMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
    );
  const nextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
    );

  // Filtragem direta baseada na seleção do dropdown ("all" mostra tudo)
  const filteredEvents = initialEvents.filter((e) => {
    if (selectedCategory === "all") return true;
    return e.category === selectedCategory;
  });

  return (
    <div className="flex flex-col w-full min-h-screen bg-background text-foreground p-4 gap-4 max-w-lg mx-auto">
      {/* Barra Superior com a seleção de categorias integrada */}
      <TopBar
        title={title}
        onPrev={prevMonth}
        onNext={nextMonth}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Grelha do Calendário */}
      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        <MonthGrid date={currentDate} events={filteredEvents} />
      </div>
    </div>
  );
}
