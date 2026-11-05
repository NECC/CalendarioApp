import type { calendarEvent } from "@/types/calendar";
import { EVENT_CATEGORY_YEAR, SUBJECTS_DATA, type Subject } from "./subjects";

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Termo como palavra inteira (não apanha "AM" dentro de "Programação"). */
const wholeWord = (term: string, flags: string) =>
  new RegExp(
    `(^|[^\\p{L}\\p{N}])${escapeRegExp(term)}($|[^\\p{L}\\p{N}])`,
    flags,
  );

function buildMatcher(subject: Subject): (title: string) => boolean {
  // sigla: case-sensitive (evita "so", "pi", "am" em texto normal)
  const siglaRe = wholeWord(subject.sigla, "u");
  // nome completo: case-insensitive
  const nameRe = wholeWord(subject.name, "iu");
  return (title) => siglaRe.test(title) || nameRe.test(title);
}

/**
 * Filtros combináveis: um evento aparece se
 *  - o seu ano está em `years` (ano inteiro), OU
 *  - o título corresponde a alguma das disciplinas em `siglas`.
 * Sem nenhum filtro, mostra tudo.
 */
export function filterEvents(
  events: calendarEvent[],
  years: number[],
  siglas: string[],
): calendarEvent[] {
  if (years.length === 0 && siglas.length === 0) return events;

  const matchers = siglas
    .map((sigla) => SUBJECTS_DATA.find((s) => s.sigla === sigla))
    .filter((s): s is Subject => Boolean(s))
    .map(buildMatcher);

  return events.filter((event) => {
    const eventYear = EVENT_CATEGORY_YEAR[event.category];
    if (eventYear !== undefined && years.includes(eventYear)) return true;
    return matchers.some((match) => match(event.title));
  });
}