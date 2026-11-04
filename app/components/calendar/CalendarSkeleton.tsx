export function CalendarSkeleton() {
  return (
    <div className="flex w-full min-h-screen p-6 gap-6 animate-pulse bg-background text-foreground">
      {/* Skeleton da Barra Lateral de Filtros */}
      <aside className="w-64 border-r border-border hidden md:flex flex-col gap-6">
        <div className="h-7 w-20 bg-muted/40 rounded" />
        <div className="flex flex-col gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-24 bg-muted/30 rounded" />
              <div className="h-2 w-2 rounded-full bg-muted/30" />
            </div>
          ))}
        </div>
      </aside>

      {/* Skeleton da Área Principal do Calendário */}
      <main className="flex-1 flex flex-col gap-5">
        <div className="h-8 w-40 bg-muted/40 rounded" />
        <div className="flex items-center justify-between">
          <div className="h-9 w-48 bg-muted/40 rounded" />
          <div className="h-9 w-32 bg-muted/40 rounded" />
        </div>
        <div className="grid grid-cols-7 gap-2 flex-1 min-h-[600px] bg-muted/10 rounded-lg p-4" />
      </main>
    </div>
  );
}
