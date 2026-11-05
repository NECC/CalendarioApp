// Reproduz o layout do EventCalendar (barra, calendário 3/4, agenda 1/4)
export function CalendarSkeleton() {
  return (
    <div
      className="flex flex-col w-full h-dvh bg-background p-4 gap-4 max-w-lg mx-auto animate-pulse overflow-hidden"
      aria-busy="true"
      aria-label="A carregar calendário"
    >
      <div className="flex items-center justify-between w-full px-1 shrink-0">
        <div className="h-10 w-48 rounded-full bg-muted/30" />
        <div className="h-10 w-10 rounded-full bg-muted/30" />
      </div>

      <div className="flex-[3_1_0%] min-h-0 bg-card rounded-3xl border border-border p-4 flex flex-col gap-3">
        <div className="grid grid-cols-7 gap-1 shrink-0">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="h-3 mx-2 rounded bg-muted/30" />
          ))}
        </div>
        <div className="flex-1 min-h-0 grid grid-cols-7 grid-rows-6 gap-x-1">
          {Array.from({ length: 42 }, (_, i) => (
            <div key={i} className="flex items-center justify-center min-h-0">
              <div className="h-full max-h-11 aspect-square rounded-full bg-muted/15" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex-[1_1_0%] min-h-[10rem] bg-card rounded-3xl border border-border p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="h-9 w-32 rounded bg-muted/30" />
          <div className="h-6 w-20 rounded-full bg-muted/30" />
        </div>
        <div className="h-14 rounded-2xl bg-muted/15" />
      </div>
    </div>
  );
}
