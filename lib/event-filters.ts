import { EVENT_CATEGORY_YEAR, SUBJECTS_DATA, type Subject } from "@/lib/subjects";
import type { CalendarEvent } from "@/types/calendar";

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Looks for the term as a whole word, so "AM" does not match inside another word. */
const wholeWord = (term: string, flags: string) =>
  new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(term)}($|[^\\p{L}\\p{N}])`, flags);

/** A title belongs to a subject if it has the subject's code or full name. */
function buildMatcher(subject: Subject): (title: string) => boolean {
  const codeRe = wholeWord(subject.code, "u"); // case-sensitive
  const nameRe = wholeWord(subject.name, "iu"); // case-insensitive
  return (title) => codeRe.test(title) || nameRe.test(title);
}

/**
 * An event appears if its year is in `years` or if it belongs to one of the
 * subjects in `codes`. With no filters, all events appear.
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
