// Dá à página a lista de testes. O service worker guarda a resposta para funcionar sem ligação.
import { NextResponse } from "next/server";
import { getCalendarEvents } from "@/lib/calendar-data";

export async function GET() {
  return NextResponse.json({ events: getCalendarEvents() });
}
