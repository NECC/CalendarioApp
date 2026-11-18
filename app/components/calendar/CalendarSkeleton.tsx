// Esqueleto do ecrã principal, mostrado enquanto os dados carregam.
export function CalendarSkeleton({ desktop = false }: { desktop?: boolean }) {
  if (desktop) return <DesktopSkeleton />;
  return (
    <div
      className="flex flex-col w-full h-dvh bg-background px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[max(1rem,env(safe-area-inset-bottom))] gap-4 max-w-lg mx-auto animate-pulse overflow-hidden"
      aria-busy="true"
      aria-label="A carregar o calendário"
    >
      <div className="flex items-center justify-between w-full px-1 shrink-0">
        <div className="h-10 w-40 rounded-full" />
        <div className="flex gap-2">
          <div className="h-10 w-10 rounded-full" />
          <div className="h-10 w-10 rounded-full" />
        </div>
      </div>

      <div className="flex-[3_1_0%] min-h-0 rounded-3xl border border-border p-4 flex flex-col gap-3">
        <div className="grid grid-cols-7 gap-1 shrink-0">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="h-3 mx-2 rounded" />
          ))}
        </div>
        <div className="flex-1 min-h-0 grid grid-cols-7 grid-rows-6 gap-x-1">
          {Array.from({ length: 42 }, (_, i) => (
            <div key={i} className="flex items-center justify-center min-h-0">
              <div className="h-full max-h-11 aspect-square rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex-[1_1_0%] min-h-[10rem] rounded-3xl border border-border p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="h-9 w-32 rounded" />
          <div className="h-6 w-20 rounded-full" />
        </div>
        <div className="h-14 rounded-2xl" />
      </div>
    </div>
  );
}

/** O mesmo, com o calendário e a agenda lado a lado, como no computador. */
function DesktopSkeleton() {
  return (
    <div
      className="flex flex-col w-full h-dvh bg-background px-6 lg:px-10 py-6 gap-6 max-w-6xl mx-auto animate-pulse overflow-hidden"
      aria-busy="true"
      aria-label="A carregar o calendário"
    >
      <div className="flex items-center justify-between w-full px-1 shrink-0">
        <div className="h-10 w-64 rounded-full" />
        <div className="h-10 w-10 rounded-full" />
      </div>
      <div className="flex-1 min-h-0 flex gap-6">
        <div className="flex-1 rounded-3xl border border-border" />
        <div className="w-80 xl:w-96 shrink-0 rounded-3xl border border-border" />
      </div>
    </div>
  );
}
