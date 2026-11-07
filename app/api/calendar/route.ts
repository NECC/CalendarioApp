// Gives the page the list of tests. The service worker caches the response for offline use.
import { NextResponse } from "next/server";
import { getCalendarEvents } from "@/lib/calendar-data";

export async function GET() {
  return NextResponse.json({ events: getCalendarEvents() });
}
