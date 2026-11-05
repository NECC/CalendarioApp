"use client";
// ^ Isto é obrigatório: "navigator" só existe no browser.
//   Um Server Component corre no servidor (Node), onde não há browser nem service workers.

import { useEffect } from "react";

export function RegisterSW() {
  // useEffect só corre no browser, DEPOIS de a página aparecer.
  useEffect(() => {
    // Nem todos os browsers suportam service workers — verificamos primeiro.
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", {
        scope: "/", // o SW controla o site todo
        updateViaCache: "none", // nunca usar uma versão antiga do sw.js em cache
      })
      .then((reg) => console.log("[SW] registado:", reg.scope))
      .catch((err) => console.error("[SW] erro ao registar:", err));
  }, []); // [] = corre só uma vez

  // Não mostra nada no ecrã.
  return null;
}
