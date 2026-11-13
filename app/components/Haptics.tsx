"use client";
// Dá uma pequena vibração sempre que se toca num botão.
//
// - Android: usa navigator.vibrate. Com menos de ~20 ms, muitos telemóveis nem chegam a
//   arrancar o motor, por isso usa 25 ms.
// - iPhone: o Safari não tem navigator.vibrate, mas um <input type="checkbox" switch>
//   vibra quando é alternado por um toque real. Desde o iOS 26.5, alterná-lo por código
//   (label.click()) já não vibra, por isso cada botão leva por cima um <label>
//   transparente com um switch escondido lá dentro: o dedo toca no label, o iOS passa o
//   toque ao switch e vibra. Precisa de "Sons e vibração > Vibração do sistema" ligada.
//
// Para um botão não vibrar, põe-lhe o atributo data-no-haptic.

import { useEffect } from "react";
import { isIOS } from "@/lib/device";

const CLICKABLE = 'button, [role="button"], a[href], summary, input[type="checkbox"], input[type="radio"]';

// No iPhone só se põe o label em botões: dentro de um link ou de um <summary> o label
// fica com o clique e o link deixa de abrir.
const IOS_HOSTS = 'button, [role="button"]';
const IOS_MARK = "data-haptic";

const IOS_CSS = `
label[${IOS_MARK}] {
  position: absolute; inset: 0; z-index: 1;
  border-radius: inherit;
  -webkit-tap-highlight-color: transparent;
  -webkit-user-select: none; user-select: none;
  touch-action: manipulation;
}
label[${IOS_MARK}] > input {
  position: absolute; left: 0; top: 0;
  width: 1px; height: 1px; margin: 0;
  opacity: 0; pointer-events: none; clip-path: inset(50%);
}
:disabled > label[${IOS_MARK}], [aria-disabled="true"] > label[${IOS_MARK}] { display: none; }
`;

function addIosOverlay(host: HTMLElement) {
  if (host.closest("[data-no-haptic]")) return;
  if (host.querySelector(`:scope > label[${IOS_MARK}]`)) return;

  // O label é absolute e tem de ficar por cima do botão, não da página.
  if (getComputedStyle(host).position === "static") host.style.position = "relative";

  const label = document.createElement("label");
  label.setAttribute(IOS_MARK, "");
  label.ariaHidden = "true";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  input.tabIndex = -1;
  input.inert = true;
  // O clique que o iOS passa ao switch subiria até ao botão e corria o onClick duas vezes.
  input.addEventListener("click", (event) => event.stopPropagation());
  label.appendChild(input);
  host.appendChild(label);
}

function setupIos() {
  const style = document.createElement("style");
  style.textContent = IOS_CSS;
  document.head.appendChild(style);

  const scan = () => document.querySelectorAll<HTMLElement>(IOS_HOSTS).forEach(addIosOverlay);
  scan();

  // O React cria botões novos e, ao mudar o texto de um botão, pode apagar o label.
  let queued = false;
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      scan();
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
    style.remove();
    document.querySelectorAll(`label[${IOS_MARK}]`).forEach((label) => label.remove());
  };
}

function setupAndroid() {
  function onClick(event: MouseEvent) {
    if (!event.isTrusted) return;
    const target = (event.target as Element | null)?.closest?.(CLICKABLE);
    if (!target || target.closest("[data-no-haptic]")) return;
    if (target.matches(":disabled, [aria-disabled='true']")) return;
    try {
      navigator.vibrate(25);
    } catch {
      // Sem suporte: o botão funciona na mesma, só não vibra.
    }
  }

  document.addEventListener("click", onClick, true);
  return () => document.removeEventListener("click", onClick, true);
}

export function Haptics() {
  useEffect(() => {
    // Só em ecrãs táteis: num computador não há nada para vibrar.
    if (!window.matchMedia("(pointer: coarse)").matches) return;
    if (isIOS()) return setupIos();
    if (typeof navigator.vibrate === "function") return setupAndroid();
  }, []);

  return null;
}
