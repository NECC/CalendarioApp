// List of tests and submissions: dates are changed here.
// The page and the reminder cron both read from here, so they always agree.
import type { CalendarEvent } from "@/types/calendar";

interface RawItem {
  subject: string;
  /** "YYYY-MM-DD" */
  day: string;
  type: string;
}

// Academic year 2026/27: January tests and resits are in 2027.
//
// The category names and the Portuguese `type` values below are part of each
// event's ID, and stars are saved by ID. Changing them would lose saved stars.
// TYPE_LABELS holds the English text shown in the app.
const RAW_DATA: Record<string, RawItem[]> = {
  ano1: [
    { subject: "PF", day: "2026-10-22", type: "Teste" },
    { subject: "TFM", day: "2026-11-05", type: "Teste" },
    { subject: "LP-I", day: "2026-11-09", type: "Entrega - (1ªParte)" },
    { subject: "Cálculo", day: "2026-11-08", type: "Teste" },
    { subject: "Álgebra Linear CC", day: "2026-11-19", type: "Teste" },
    { subject: "Cálculo", day: "2026-12-16", type: "Teste" },
    { subject: "Álgebra Linear CC", day: "2026-12-19", type: "Teste" },
    { subject: "LP-I", day: "2026-12-31", type: "Entrega - (2ªParte)" },
    { subject: "PF", day: "2027-01-06", type: "Teste" },
    { subject: "TFM", day: "2027-01-09", type: "Teste" },
    { subject: "Álgebra Linear CC", day: "2027-01-22", type: "Recurso" },
    { subject: "Cálculo", day: "2027-01-19", type: "Recurso" },
    { subject: "PF", day: "2027-01-26", type: "Recurso" },
    { subject: "TFM", day: "2027-01-28", type: "Recurso" },
  ],
  ano2: [
    { subject: "Lógica CC", day: "2026-11-03", type: "Teste" },
    { subject: "Álgebra", day: "2026-11-06", type: "Teste" },
    { subject: "Análise Numérica", day: "2026-11-11", type: "Teste" },
    { subject: "AeC", day: "2026-11-15", type: "Teste" },
    { subject: "Álgebra", day: "2026-12-18", type: "Teste" },
    { subject: "SCR", day: "2027-01-05", type: "Teste" },
    { subject: "Análise Numérica", day: "2027-01-07", type: "Teste" },
    { subject: "Lógica CC", day: "2027-01-08", type: "Teste" },
    { subject: "AeC", day: "2027-01-10", type: "Teste" },
    { subject: "Álgebra", day: "2027-01-20", type: "Recurso" },
    { subject: "AeC", day: "2027-01-24", type: "Recurso" },
    { subject: "Análise Numérica", day: "2027-01-29", type: "Recurso" },
    { subject: "Lógica CC", day: "2027-01-27", type: "Recurso" },
    { subject: "SCR", day: "2027-01-31", type: "Recurso" },
  ],
  ano3: [
    { subject: "PA", day: "2026-10-28", type: "Teste" },
    { subject: "CP", day: "2026-10-25", type: "Teste" },
    { subject: "CC", day: "2026-11-05", type: "Teste" },
    { subject: "LC", day: "2026-11-10", type: "Entrega" },
    { subject: "TNC", day: "2026-11-10", type: "Mini-Teste" },
    { subject: "Estatística", day: "2026-11-07", type: "Teste" },
    { subject: "LC", day: "2026-12-08", type: "Entrega" },
    { subject: "Estatística", day: "2026-12-12", type: "Teste" },
    { subject: "PLC", day: "2026-12-16", type: "Teste" },
    { subject: "PA", day: "2026-12-17", type: "Teste" },
    { subject: "CP", day: "2026-12-20", type: "Teste" },
    { subject: "LC", day: "2027-01-05", type: "Teste" },
    { subject: "TNC", day: "2027-01-07", type: "Teste" },
    { subject: "CC", day: "2027-01-09", type: "Teste" },
    { subject: "TNC", day: "2027-01-12", type: "Mini-Teste" },
    { subject: "PLC", day: "2027-01-17", type: "Entrega" },
    { subject: "CP", day: "2027-01-22", type: "Recurso" },
    { subject: "CC", day: "2027-01-30", type: "Recurso" },
    { subject: "PLC", day: "2027-01-21", type: "Recurso" },
    { subject: "Estatística", day: "2027-01-23", type: "Recurso" },
    { subject: "LC", day: "2027-01-29", type: "Recurso" },
    { subject: "TNC", day: "2027-01-28", type: "Recurso" },
    { subject: "PA", day: "2027-01-19", type: "Recurso" },
  ],
};

const TYPE_LABELS: Record<string, string> = {
  Teste: "Test",
  "Mini-Teste": "Mini-test",
  Recurso: "Resit",
  Entrega: "Submission",
  "Entrega - (1ªParte)": "Submission (part 1)",
  "Entrega - (2ªParte)": "Submission (part 2)",
};

/** For example, "ano1-2026-11-08-calculo-teste". */
function eventId(categoryId: string, item: RawItem): string {
  const slug = `${item.subject}-${item.type}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // removes accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${categoryId}-${item.day}-${slug}`;
}

export function getCalendarEvents(): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const [categoryId, items] of Object.entries(RAW_DATA)) {
    for (const item of items) {
      events.push({
        id: eventId(categoryId, item),
        title: `${item.subject} - ${TYPE_LABELS[item.type] ?? item.type}`,
        // A date alone would be read as UTC, which can land on the wrong local day.
        startTimestampnz: `${item.day}T09:00:00`,
        category: categoryId,
      });
    }
  }

  return events;
}
