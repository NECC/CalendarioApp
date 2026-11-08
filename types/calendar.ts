/** Um teste, entrega ou evento do calendário. */
export interface CalendarEvent {
  /** ID estável, usado para guardar as estrelas. */
  id: string;
  title: string;
  /** Data e hora locais. A lista não tem horas reais, por isso só se usa a data. */
  startTimestampnz: string;
  /** "ano1", "ano2", "ano3" ou "eventos". */
  category: string;
}
