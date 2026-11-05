// Reproduz o layout mobile do EventCalendar (barra, grelha, agenda)
// para não haver "salto" quando o calendário real monta.
export function CalendarSkeleton() {
  return (
    <div
      className="flex flex-col w-full min-h-screen bg-background p-4 gap-4 max-w-lg mx-auto animate-pulse"
      aria-busy="true"
      aria-label="A carregar calendário"
    >
      {/* TopBar */}
      <div className="flex items-center justify-between w-full px-1 py-2">
        <div className="h-10 w-56 rounded-full bg-muted/30" />
        <div className="h-10 w-10 rounded-full bg-muted/30" />
      </div>

      {/* Grelha do mês */}
      <div className="bg-card rounded-3xl border border-border p-4 pb-6">
        <div className="grid grid-cols-7 mb-4 gap-1">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="h-3 mx-2 rounded bg-muted/30" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-3 gap-x-1 justify-items-center">
          {Array.from({ length: 42 }, (_, i) => (
            <div key={i} className="w-10 h-10 rounded-full bg-muted/15" />
          ))}
        </div>
      </div>

      {/* Agenda do dia */}
      <div className="bg-card rounded-3xl border border-border p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="h-9 w-32 rounded bg-muted/30" />
          <div className="h-6 w-20 rounded-full bg-muted/30" />
        </div>
        <div className="h-16 rounded-2xl bg-muted/15" />
      </div>
    </div>
  );
}
