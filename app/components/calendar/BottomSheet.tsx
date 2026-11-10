"use client";
// Painel que sobe a partir de baixo, usado pelos filtros e pelos avisos.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const CloseContext = createContext<() => void>(() => {});

/** Fecha o painel com a animação, a partir de qualquer componente dentro dele. */
export function useCloseSheet() {
  return useContext(CloseContext);
}

/** Botão que fecha o painel. */
export function SheetCloseButton(props: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick">) {
  const close = useCloseSheet();
  return <button {...props} onClick={close} />;
}

interface BottomSheetProps {
  title: string;
  onClose: () => void;
  /** Botões extra no cabeçalho, à esquerda do X. */
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

export function BottomSheet({ title, onClose, headerActions, children }: BottomSheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Ao fechar, primeiro faz a animação de saída e só depois remove o painel.
  const [shown, setShown] = useState(false);
  const closingRef = useRef(false);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => {
      cancelAnimationFrame(id);
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      onClose();
      return;
    }
    setShown(false);
    closeTimer.current = window.setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [requestClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 motion-reduce:transition-none ${
          shown ? "opacity-100" : "opacity-0"
        }`}
        onClick={requestClose}
        aria-hidden="true"
      />
      <div
        className={`relative w-full max-w-lg mx-auto bg-background rounded-t-3xl border-t border-border shadow-2xl flex flex-col max-h-[85vh] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          shown ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b border-border/50 bg-background z-20 rounded-t-3xl">
          <h3 className="text-xl font-extrabold text-foreground tracking-tight">{title}</h3>
          <div className="flex items-center gap-2">
            {headerActions}
            <button
              ref={closeRef}
              onClick={requestClose}
              aria-label={`Fechar ${title.toLowerCase()}`}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/20 text-foreground hover:bg-muted/40 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain flex flex-col">
          <CloseContext.Provider value={requestClose}>{children}</CloseContext.Provider>
        </div>
      </div>
    </div>
  );
}
