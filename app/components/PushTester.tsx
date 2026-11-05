"use client";
// ⚠️ COMPONENTE TEMPORÁRIO só para aprender/testar.
// Mais tarde passamos esta lógica para o ecrã de filtros (escolher UCs + ativar avisos).

import { useEffect, useState } from "react";
import { subscribeUser, unsubscribeUser, sendTestNotification } from "@/app/actions";

// A chave pública VAPID vem em texto "base64url", mas o browser quer bytes (Uint8Array).
// Esta função faz essa conversão. É sempre igual — não precisas de a decorar.
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function PushTester() {
  const [supported, setSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [message, setMessage] = useState("Amanhã tens teste de Cálculo!");
  const [status, setStatus] = useState("");

  // Ao abrir: o browser suporta push? E esta pessoa já tinha ativado antes?
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        setSupported(true);
        setSubscription(sub);
      });
  }, []);

  async function ativar() {
    // 1) Pede permissão. TEM de ser dentro de um clique — senão o browser bloqueia.
    const permissao = await Notification.requestPermission();
    if (permissao !== "granted") {
      setStatus("Permissão recusada 😕");
      return;
    }

    // 2) Espera que o service worker (aula 1) esteja pronto.
    const reg = await navigator.serviceWorker.ready;

    // 3) Pede ao push service (Google/Apple/Mozilla) uma "morada" para este dispositivo.
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true, // promessa: cada push mostra uma notificação visível
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    });
    setSubscription(sub);

    // 4) Manda a morada para o servidor. toJSON() transforma-a num objeto simples
    //    (endpoint + chaves) que dá para enviar pela rede.
    await subscribeUser(JSON.parse(JSON.stringify(sub)));
    setStatus("Notificações ativadas ✅");
  }

  async function desativar() {
    await subscription?.unsubscribe(); // apaga do lado do browser
    setSubscription(null);
    await unsubscribeUser(); // apaga do lado do servidor
    setStatus("Notificações desativadas");
  }

  async function testar() {
    const res = await sendTestNotification(message);
    setStatus(res.success ? "Enviado! Vê a notificação 📬" : `Erro: ${res.error}`);
  }

  if (!supported) {
    return <Box>Este browser não suporta notificações push.</Box>;
  }

  return (
    <Box>
      <strong>🔔 Teste de notificações</strong>
      {subscription ? (
        <>
          <input
            className="border border-border rounded px-2 py-1 bg-background"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button className="bg-accent text-background rounded px-2 py-1" onClick={testar}>
            Enviar teste
          </button>
          <button className="underline text-xs" onClick={desativar}>
            Desativar
          </button>
        </>
      ) : (
        <button className="bg-accent text-background rounded px-2 py-1" onClick={ativar}>
          Ativar notificações
        </button>
      )}
      {status && <span className="text-xs">{status}</span>}
    </Box>
  );
}

function Box({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 p-3 w-64 text-sm rounded-xl border border-border bg-background shadow-lg">
      {children}
    </div>
  );
}
