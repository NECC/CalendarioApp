export type CategoryId = string; // Permitir qualquer string para os IDs

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface calendarEvent {
  id: string;
  title: string;
  description?: string;
  startTimestampnz: Date | string;
  endTimestampnz: Date | string;
  category: string; // Permitir string para corresponder aos novos IDs
}