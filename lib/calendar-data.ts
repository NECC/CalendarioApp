// =============================================================
// Fonte única dos testes/eventos.
// Usada pela página (via /api/calendar) e pelo cron das notificações
// (/api/cron/notify) — assim os dois veem sempre as mesmas datas.
// =============================================================
import type { calendarEvent, Category } from "@/types/calendar";

interface RawItem {
  uc: string;
  /** "YYYY-MM-DD" */
  day: string;
  type: string;
}

// Ano letivo 2026/27: os testes/recursos de janeiro são de 2027.
const RAW_DATA: Record<string, RawItem[]> = {
  "1º ano": [
    { uc: "PF", day: "2026-10-22", type: "Teste" },
    { uc: "TFM", day: "2026-11-05", type: "Teste" },
    { uc: "LP-I", day: "2026-11-09", type: "Entrega - (1ªParte)" },
    { uc: "Cálculo", day: "2026-11-08", type: "Teste" },
    { uc: "Álgebra Linear CC", day: "2026-11-19", type: "Teste" },
    { uc: "Cálculo", day: "2026-12-16", type: "Teste" },
    { uc: "Álgebra Linear CC", day: "2026-12-19", type: "Teste" },
    { uc: "LP-I", day: "2026-12-31", type: "Entrega - (2ªParte)" },
    { uc: "PF", day: "2027-01-06", type: "Teste" },
    { uc: "TFM", day: "2027-01-09", type: "Teste" },
    { uc: "Álgebra Linear CC", day: "2027-01-22", type: "Recurso" },
    { uc: "Cálculo", day: "2027-01-19", type: "Recurso" },
    { uc: "PF", day: "2027-01-26", type: "Recurso" },
    { uc: "TFM", day: "2027-01-28", type: "Recurso" },
  ],
  "2º ano": [
    { uc: "Lógica CC", day: "2026-11-03", type: "Teste" },
    { uc: "Álgebra", day: "2026-11-06", type: "Teste" },
    { uc: "Análise Numérica", day: "2026-11-11", type: "Teste" },
    { uc: "AeC", day: "2026-11-15", type: "Teste" },
    { uc: "Álgebra", day: "2026-12-18", type: "Teste" },
    { uc: "SCR", day: "2027-01-05", type: "Teste" },
    { uc: "Análise Numérica", day: "2027-01-07", type: "Teste" },
    { uc: "Lógica CC", day: "2027-01-08", type: "Teste" },
    { uc: "AeC", day: "2027-01-10", type: "Teste" },
    { uc: "Álgebra", day: "2027-01-20", type: "Recurso" },
    { uc: "AeC", day: "2027-01-24", type: "Recurso" },
    { uc: "Análise Numérica", day: "2027-01-29", type: "Recurso" },
    { uc: "Lógica CC", day: "2027-01-27", type: "Recurso" },
    { uc: "SCR", day: "2027-01-31", type: "Recurso" },
  ],
  "3º ano": [
    { uc: "PA", day: "2026-10-28", type: "Teste" },
    { uc: "CP", day: "2026-10-25", type: "Teste" },
    { uc: "CC", day: "2026-11-05", type: "Teste" },
    { uc: "LC", day: "2026-11-10", type: "Entrega" },
    { uc: "TNC", day: "2026-11-10", type: "Mini-Teste" },
    { uc: "Estatística", day: "2026-11-07", type: "Teste" },
    { uc: "LC", day: "2026-12-08", type: "Entrega" },
    { uc: "Estatística", day: "2026-12-12", type: "Teste" },
    { uc: "PLC", day: "2026-12-16", type: "Teste" },
    { uc: "PA", day: "2026-12-17", type: "Teste" },
    { uc: "CP", day: "2026-12-20", type: "Teste" },
    { uc: "LC", day: "2027-01-05", type: "Teste" },
    { uc: "TNC", day: "2027-01-07", type: "Teste" },
    { uc: "CC", day: "2027-01-09", type: "Teste" },
    { uc: "TNC", day: "2027-01-12", type: "Mini-Teste" },
    { uc: "PLC", day: "2027-01-17", type: "Entrega" },
    { uc: "CP", day: "2027-01-22", type: "Recurso" },
    { uc: "CC", day: "2027-01-30", type: "Recurso" },
    { uc: "PLC", day: "2027-01-21", type: "Recurso" },
    { uc: "Estatística", day: "2027-01-23", type: "Recurso" },
    { uc: "LC", day: "2027-01-29", type: "Recurso" },
    { uc: "TNC", day: "2027-01-28", type: "Recurso" },
    { uc: "PA", day: "2027-01-19", type: "Recurso" },
  ],
};

export const CATEGORIES: Category[] = [
  { id: "ano1", name: "1º Ano", color: "#3B82F6" },
  { id: "ano2", name: "2º Ano", color: "#10B981" },
  { id: "ano3", name: "3º Ano", color: "#8B5CF6" },
  { id: "eventos", name: "Eventos", color: "#111827" },
];

const YEAR_TO_CATEGORY: Record<string, string> = {
  "1º ano": "ano1",
  "2º ano": "ano2",
  "3º ano": "ano3",
};

export function getCalendarEvents(): calendarEvent[] {
  const events: calendarEvent[] = [];

  for (const [ano, lista] of Object.entries(RAW_DATA)) {
    const categoryId = YEAR_TO_CATEGORY[ano] ?? "eventos";

    lista.forEach((item, index) => {
      events.push({
        id: `${categoryId}-${index}`,
        title: `${item.uc} - ${item.type}`,
        description: item.type,
        startTimestampnz: `${item.day}T09:00:00`,
        endTimestampnz: `${item.day}T11:00:00`,
        category: categoryId,
      });
    });
  }

  return events;
}
