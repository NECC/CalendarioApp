import { EVENT_CATEGORY_YEAR, SUBJECTS_DATA, type Subject } from "@/lib/subjects";
import type { CalendarEvent } from "@/types/calendar";

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Procura o termo como palavra inteira, para "AM" não apanhar outra palavra. */
const wholeWord = (term: string, flags: string) =>
  new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(term)}($|[^\\p{L}\\p{N}])`, flags);

/** Um título pertence a uma UC se tiver o código ou o nome completo da UC. */
function buildMatcher(subject: Subject): (title: string) => boolean {
  const codeRe = wholeWord(subject.code, "u"); // distingue maiúsculas
  const nameRe = wholeWord(subject.name, "iu"); // não distingue maiúsculas
  return (title) => codeRe.test(title) || nameRe.test(title);
}

/**
 * Um evento aparece se o seu ano estiver em `years` ou se pertencer a uma das
 * UCs em `codes`. Sem filtros, aparecem todos os eventos.
 */
export function filterEvents(events: CalendarEvent[], years: number[], codes: string[]): CalendarEvent[] {
  if (years.length === 0 && codes.length === 0) return events;

  const matchers = SUBJECTS_DATA.filter((s) => codes.includes(s.code)).map(buildMatcher);

  return events.filter((event) => {
    const year = EVENT_CATEGORY_YEAR[event.category];
    if (year !== undefined && years.includes(year)) return true;
    return matchers.some((matches) => matches(event.title));
  });
}
