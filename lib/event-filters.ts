import type { calendarEvent } from "@/types/calendar";
import {
  EVENT_CATEGORY_YEAR,
  SUBJECTS_DATA,
  type Subject,
  type YearFilter,
} from "./subjects";

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

export function filterEvents(
  events: calendarEvent[],
  year: YearFilter,
  selectedSiglas: string[],
): calendarEvent[] {
  const matchers = selectedSiglas
    .map((sigla) => SUBJECTS_DATA.find((s) => s.sigla === sigla))
    .filter((s): s is Subject => Boolean(s))
    .map(buildMatcher);

  return events.filter((event) => {
    if (year !== "all" && EVENT_CATEGORY_YEAR[event.category] !== year) {
      return false;
    }
    if (matchers.length > 0 && !matchers.some((m) => m(event.title))) {
      return false;
    }
    return true;
  });
}
