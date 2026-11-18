// Lista de testes e entregas: as datas mudam-se aqui.
// Copiada do calendário do NECChange (https://necchange.necc.di.uminho.pt/).
// A página e o cron dos avisos leem daqui, por isso estão sempre de acordo.
import { SUBJECTS_DATA } from "@/lib/subjects";
import type { CalendarEvent } from "@/types/calendar";

interface RawItem {
  subject: string;
  /** "YYYY-MM-DD" */
  day: string;
  type: string;
}

// Ano letivo 2026/27: os testes e recursos de janeiro são de 2027.
//
// Os nomes das categorias e os valores de `type` fazem parte do ID de cada evento,
// e as estrelas são guardadas por ID. Mudá-los faria perder as estrelas guardadas.
const RAW_DATA: Record<string, RawItem[]> = {
  ano1: [
    { subject: "LP-I", day: "2026-10-09", type: "Teste" },
    { subject: "PF", day: "2026-10-21", type: "Teste" },
    { subject: "LP-I", day: "2026-10-23", type: "Teste" },
    { subject: "TFM", day: "2026-10-30", type: "Teste" },
    { subject: "Cálculo", day: "2026-11-04", type: "Teste" },
    { subject: "Álgebra Linear CC", day: "2026-11-09", type: "Teste" },
    { subject: "LP-I", day: "2026-11-16", type: "Entrega" },
    { subject: "LP-I", day: "2026-12-06", type: "Entrega" },
    { subject: "TFM", day: "2026-12-15", type: "Teste" },
    { subject: "Cálculo", day: "2026-12-17", type: "Teste" },
    { subject: "LP-I", day: "2027-01-03", type: "Entrega" },
    { subject: "Álgebra Linear CC", day: "2027-01-04", type: "Teste" },
    { subject: "PF", day: "2027-01-08", type: "Teste" },
  ],
  ano2: [
    { subject: "Lógica CC", day: "2026-11-02", type: "Teste" },
    { subject: "Álgebra", day: "2026-11-12", type: "Teste" },
    { subject: "AeC", day: "2026-11-14", type: "Teste" },
    { subject: "Análise Numérica", day: "2026-11-20", type: "Teste" },
    { subject: "Lógica CC", day: "2026-12-14", type: "Teste" },
    { subject: "Álgebra", day: "2026-12-16", type: "Teste" },
    { subject: "SCR", day: "2026-12-18", type: "Teste" },
    { subject: "Análise Numérica", day: "2027-01-05", type: "Teste" },
    { subject: "AeC", day: "2027-01-07", type: "Teste" },
  ],
  ano3: [
    { subject: "LC", day: "2026-10-07", type: "Apresentação" },
    { subject: "LC", day: "2026-10-08", type: "Apresentação" },
    { subject: "CP", day: "2026-10-24", type: "Teste" },
    { subject: "LC", day: "2026-11-04", type: "Apresentação" },
    { subject: "LC", day: "2026-11-05", type: "Apresentação" },
    { subject: "CC", day: "2026-11-06", type: "Teste" },
    { subject: "TNC", day: "2026-11-18", type: "Teste" },
    { subject: "LC", day: "2026-12-02", type: "Apresentação" },
    { subject: "LC", day: "2026-12-03", type: "Apresentação" },
    { subject: "CP", day: "2026-12-12", type: "Teste" },
    { subject: "Estatística", day: "2026-12-15", type: "Teste" },
    { subject: "CC", day: "2026-12-17", type: "Teste" },
    { subject: "LC", day: "2027-01-04", type: "Apresentação" },
    { subject: "PLC", day: "2027-01-06", type: "Teste" },
  ],
  eventos: [
    { subject: "LIP", day: "2026-09-16", type: "Instalar Linux" },
    { subject: "LIP", day: "2026-09-17", type: "Instalar Linux" },
    { subject: "LIP", day: "2026-09-18", type: "Instalar Linux" },
    { subject: "LIP", day: "2026-09-21", type: "Instalar Linux" },
    { subject: "LIP", day: "2026-09-22", type: "Instalar Linux" },
    { subject: "50DI", day: "2026-09-23", type: "Lanche" },
  ],
};

/** Por exemplo, "ano1-2026-11-08-calculo-teste". */
function eventId(categoryId: string, item: RawItem): string {
  const slug = `${item.subject}-${item.type}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // tira os acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${categoryId}-${item.day}-${slug}`;
}

/** A UC de uma linha da lista, que pode estar escrita pela sigla ou pelo nome. */
function findSubject(subject: string) {
  return SUBJECTS_DATA.find((s) => s.code === subject || s.name === subject);
}

export function getCalendarEvents(): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const [categoryId, items] of Object.entries(RAW_DATA)) {
    for (const item of items) {
      const subject = findSubject(item.subject);
      events.push({
        id: eventId(categoryId, item),
        // O título usa o nome completo; o ID continua com a sigla, para não perder estrelas.
        title: `${subject?.name ?? item.subject} - ${item.type}`,
        subject: subject?.code ?? item.subject,
        // Uma data sozinha seria lida como UTC, o que pode cair no dia local errado.
        startTimestampnz: `${item.day}T09:00:00`,
        category: categoryId,
      });
    }
  }

  return events;
}
