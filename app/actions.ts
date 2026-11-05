"use server";
// ^ "use server" = estas funções correm SÓ no servidor (Vercel), nunca no telemóvel.
//   Mas o código do cliente pode chamá-las como se fossem funções normais
//   (o Next trata do pedido HTTP por trás). Chamam-se "Server Actions".
//   É aqui que pode estar a chave PRIVADA, porque nunca chega ao browser.

import webpush, { type PushSubscription } from "web-push";

// Configura o web-push com as nossas chaves VAPID (vêm do .env.local).
// Fazemos isto dentro de uma função para dar um erro claro se faltarem as chaves.
function configurarWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("Faltam as chaves VAPID no .env.local");
  }
  // O "mailto" serve para o push service te contactar se houver problemas.
  webpush.setVapidDetails("mailto:necc@example.com", publicKey, privateKey);
}

// ⚠️ TEMPORÁRIO: guardamos a subscription numa variável, em memória.
// Isto perde-se sempre que o servidor reinicia e só guarda UMA pessoa.
// Na aula 4 trocamos isto por uma base de dados.
let subscription: PushSubscription | null = null;

// Chamada pelo cliente quando a pessoa ativa as notificações.
export async function subscribeUser(sub: PushSubscription) {
  subscription = sub;
  console.log("[push] nova subscription:", sub.endpoint);
  return { success: true };
}

// Chamada quando a pessoa desativa as notificações.
export async function unsubscribeUser() {
  subscription = null;
  return { success: true };
}

// Envia uma notificação de teste para a subscription guardada.
export async function sendTestNotification(message: string) {
  if (!subscription) {
    return { success: false, error: "Ainda não há nenhuma subscription" };
  }

  configurarWebPush();

  try {
    // O texto que mandamos aqui é exatamente o que o sw.js recebe em event.data.json()
    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title: "Teste NECC", body: message, url: "/" })
    );
    return { success: true };
  } catch (error) {
    console.error("[push] erro ao enviar:", error);
    return { success: false, error: "Falhou o envio" };
  }
}
