// I probably shouldn't hardcode these.
// TODO: Make this dynamic
export type CategoryId = "all" | "event" | "exam";

export interface Category {
  id: CategoryId;
  name: string;
  color: string;
}

export interface calendarEvent {
  id: string;
  title: string;
  description: string;
  startTimestampnz: string; // ISO 8601 format
  endTimestampnz: string; // ISO 8601 format
  category: string;
}
