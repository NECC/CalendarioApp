"use client";
// Dá uma pequena vibração sempre que se toca num botão.
//
// - Android: usa navigator.vibrate.
// - iPhone: o Safari não tem navigator.vibrate, mas desde o iOS 18 um
//   <input type="checkbox" switch> vibra ao ser alternado. Clicar no <label> dele,
//   durante o toque do utilizador, dá a mesma vibração. Precisa de "Sons e vibração >
//   Vibração do sistema" ligada nas definições do iPhone; em versões antigas não faz nada.
//
// Para um botão não vibrar, põe-lhe o atributo data-no-haptic.

import { useEffect } from "react";
import { isIOS } from "@/lib/device";

const CLICKABLE = 'button, [role="button"], a[href], summary, input[type="checkbox"], input[type="radio"]';

function iosTick() {
  const label = document.createElement("label");
  label.ariaHidden = "true";
  label.style.display = "none";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  label.appendChild(input);
  document.head.appendChild(label);
  label.click();
  label.remove();
}

export function Haptics() {
  useEffect(() => {
    // Só em ecrãs táteis: num computador não há nada para vibrar.
    if (!window.matchMedia("(pointer: coarse)").matches) return;

    const ios = isIOS();
    if (!ios && typeof navigator.vibrate !== "function") return;

    function onClick(event: MouseEvent) {
      // Ignora cliques feitos por código, incluindo o do próprio iosTick.
      if (!event.isTrusted) return;
      const target = (event.target as Element | null)?.closest?.(CLICKABLE);
      if (!target || target.closest("[data-no-haptic]")) return;
      if (target.matches(":disabled, [aria-disabled='true']")) return;

      try {
        if (ios) iosTick();
        else navigator.vibrate(10);
      } catch {
        // Sem suporte: o botão funciona na mesma, só não vibra.
      }
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
