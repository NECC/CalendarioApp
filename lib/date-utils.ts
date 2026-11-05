export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Chave "YYYY-M-D" (sem zeros) para agrupar eventos por dia. */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Dia a selecionar ao mudar de mês:
 * hoje, se o mês for o atual; senão, dia 1.
 */
export function defaultSelectedDate(month: Date, today = new Date()): Date {
  return month.getFullYear() === today.getFullYear() &&
    month.getMonth() === today.getMonth()
    ? new Date(today.getFullYear(), today.getMonth(), today.getDate())
    : new Date(month.getFullYear(), month.getMonth(), 1);
}
