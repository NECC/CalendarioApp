"use client";
// Swiping sideways to change month.
import { useCallback, useEffect, useRef } from "react";

interface UseSwipeOptions {
  /** Called when swiping left (for example, next month). */
  onSwipeLeft: () => void;
  /** Called when swiping right (for example, previous month). */
  onSwipeRight: () => void;
  /** Minimum distance (px) to confirm the swipe. */
  threshold?: number;
}

type Axis = "x" | "y" | null;

const LOCK_DISTANCE = 8; // px of movement before deciding if it is horizontal or vertical
const OUT_MS = 150;
const IN_MS = 220;

/**
 * Horizontal swipe that:
 *  - ignores taps;
 *  - only reacts to mostly horizontal gestures, so vertical scrolling still works;
 *  - makes the element follow the finger and animates the content change.
 *
 * The transform is applied directly to the element, without setState,
 * so nothing re-renders during the drag.
 *
 * Usage:
 *   const { ref, handlers } = useSwipe<HTMLDivElement>({ ... });
 *   <div className="overflow-hidden touch-pan-y" {...handlers}>
 *     <div ref={ref}>content</div>
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

    if (g.axis !== "x") return; // vertical scroll: leave it to the browser

    g.dx = dx;
    // resistance: the content follows the finger, but more slowly
    el.style.transform = `translateX(${dx * 0.6}px)`;
    el.style.opacity = String(1 - Math.min(Math.abs(dx) / 500, 0.35));
  }, []);

  const finish = useCallback(
    (cancelled: boolean) => {
      const g = gesture.current;
      const el = ref.current;
      if (!g.tracking || !el) return;
      g.tracking = false;

      if (g.axis !== "x") return; // it was a tap or a vertical scroll

      if (cancelled || Math.abs(g.dx) < threshold) {
        snapBack(el);
        return;
      }

      const goNext = g.dx < 0; // dragging left means next month
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

      // 1) slide out in the direction of the finger
      el.style.transition = `transform ${OUT_MS}ms ease-in, opacity ${OUT_MS}ms ease-in`;
      el.style.transform = `translateX(${-dir * 100}%)`;
      el.style.opacity = "0";

      later(() => {
        // 2) change the month and place the new content on the opposite side
        trigger();
        el.style.transition = "none";
        el.style.transform = `translateX(${dir * 40}%)`;

        // 3) slide to the centre (2 frames so React can paint the new month)
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
