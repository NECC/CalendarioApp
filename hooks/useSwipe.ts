"use client";
// Deslizar para o lado para mudar de mês.
import { useCallback, useEffect, useRef } from "react";

interface UseSwipeOptions {
  /** Chamado ao deslizar para a esquerda (por exemplo, mês seguinte). */
  onSwipeLeft: () => void;
  /** Chamado ao deslizar para a direita (por exemplo, mês anterior). */
  onSwipeRight: () => void;
  /** Distância mínima (px) para confirmar o gesto. */
  threshold?: number;
}

type Axis = "x" | "y" | null;

const LOCK_DISTANCE = 8; // px de movimento antes de decidir se é horizontal ou vertical
const OUT_MS = 150;
const IN_MS = 220;

/**
 * Gesto horizontal que:
 *  - ignora toques;
 *  - só reage a gestos sobretudo horizontais, para o scroll vertical continuar a funcionar;
 *  - faz o elemento seguir o dedo e anima a mudança de conteúdo.
 *
 * O transform é aplicado diretamente ao elemento, sem setState,
 * por isso nada é redesenhado durante o arrasto.
 *
 * Utilização:
 *   const { ref, handlers } = useSwipe<HTMLDivElement>({ ... });
 *   <div className="overflow-hidden touch-pan-y" {...handlers}>
 *     <div ref={ref}>conteúdo</div>
 *   </div>
 */
export function useSwipe<T extends HTMLElement = HTMLDivElement>({
  onSwipeLeft,
  onSwipeRight,
  threshold = 60,
}: UseSwipeOptions) {
  const ref = useRef<T>(null);
  const callbacks = useRef({ onSwipeLeft, onSwipeRight });
  const gesture = useRef<{
    startX: number;
    startY: number;
    dx: number;
    axis: Axis;
    tracking: boolean;
  }>({ startX: 0, startY: 0, dx: 0, axis: null, tracking: false });
  const animating = useRef(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    callbacks.current = { onSwipeLeft, onSwipeRight };
  }, [onSwipeLeft, onSwipeRight]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const snapBack = (el: T) => {
    el.style.transition = `transform ${OUT_MS}ms ease-out, opacity ${OUT_MS}ms ease-out`;
    el.style.transform = "translateX(0)";
    el.style.opacity = "1";
  };

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (animating.current || e.touches.length !== 1) return;
    const t = e.touches[0];
    gesture.current = {
      startX: t.clientX,
      startY: t.clientY,
      dx: 0,
      axis: null,
      tracking: true,
    };
    const el = ref.current;
    if (el) el.style.transition = "none";
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const g = gesture.current;
    const el = ref.current;
    if (!g.tracking || !el) return;

    const t = e.touches[0];
    const dx = t.clientX - g.startX;
    const dy = t.clientY - g.startY;

    if (g.axis === null) {
      if (Math.abs(dx) < LOCK_DISTANCE && Math.abs(dy) < LOCK_DISTANCE) return;
      g.axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? "x" : "y";
    }

    if (g.axis !== "x") return; // scroll vertical: fica a cargo do browser

    g.dx = dx;
    // resistência: o conteúdo segue o dedo, mas mais devagar
    el.style.transform = `translateX(${dx * 0.6}px)`;
    el.style.opacity = String(1 - Math.min(Math.abs(dx) / 500, 0.35));
  }, []);

  const finish = useCallback(
    (cancelled: boolean) => {
      const g = gesture.current;
      const el = ref.current;
      if (!g.tracking || !el) return;
      g.tracking = false;

      if (g.axis !== "x") return; // foi um toque ou um scroll vertical

      if (cancelled || Math.abs(g.dx) < threshold) {
        snapBack(el);
        return;
      }

      const goNext = g.dx < 0; // arrastar para a esquerda é o mês seguinte
      const trigger = goNext
        ? callbacks.current.onSwipeLeft
        : callbacks.current.onSwipeRight;

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduceMotion) {
        snapBack(el);
        trigger();
        return;
      }

      animating.current = true;
      const dir = goNext ? 1 : -1;

      // 1) sai na direção do dedo
      el.style.transition = `transform ${OUT_MS}ms ease-in, opacity ${OUT_MS}ms ease-in`;
      el.style.transform = `translateX(${-dir * 100}%)`;
      el.style.opacity = "0";

      later(() => {
        // 2) muda o mês e coloca o novo conteúdo no lado oposto
        trigger();
        el.style.transition = "none";
        el.style.transform = `translateX(${dir * 40}%)`;

        // 3) desliza para o centro (2 frames para o React desenhar o novo mês)
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            el.style.transition = `transform ${IN_MS}ms ease-out, opacity ${IN_MS}ms ease-out`;
            el.style.transform = "translateX(0)";
            el.style.opacity = "1";
            later(() => {
              el.style.transition = "";
              animating.current = false;
            }, IN_MS);
          }),
        );
      }, OUT_MS);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [threshold],
  );

  const onTouchEnd = useCallback(() => finish(false), [finish]);
  const onTouchCancel = useCallback(() => finish(true), [finish]);

  return {
    ref,
    handlers: { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel },
  };
}
