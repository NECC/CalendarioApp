// =============================================================
// Diagnóstico: abre /api/push/health no browser para ver se o servidor
// tem tudo o que precisa para as notificações.
// Só devolve true/false — nunca o valor das chaves.
// =============================================================
import { NextResponse, connection } from "next/server";

export async function GET() {
  // Obriga a correr em cada pedido (senão o Next calculava isto no build).
  await connection();
  const checks = {
    vapidPublicKey: Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
    vapidPrivateKey: Boolean(process.env.VAPID_PRIVATE_KEY),
    vapidSubject: Boolean(process.env.VAPID_SUBJECT),
    cronSecret: Boolean(process.env.CRON_SECRET),
    redis: Boolean(
      (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL) &&
        (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN),
    ),
  };
  const ok = Object.values(checks).every(Boolean);
  return NextResponse.json({ ok, ...checks }, { headers: { "Cache-Control": "no-store" } });
}
