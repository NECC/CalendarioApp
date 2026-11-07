/** A test, submission or event in the calendar. */
export interface CalendarEvent {
  /** Stable ID, used to save stars. */
  id: string;
  title: string;
  /** Local date and time. The list has no real times, so only the date is used. */
  startTimestampnz: string;
  /** "ano1", "ano2", "ano3" or "eventos". */
  category: string;
}
