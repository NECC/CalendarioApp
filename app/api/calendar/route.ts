import { NextResponse } from "next/server";
import { CATEGORIES, getCalendarEvents } from "@/lib/calendar-data";

export async function GET() {
  return NextResponse.json({ categories: CATEGORIES, events: getCalendarEvents() });
}
