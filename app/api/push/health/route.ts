// Diagnóstico das notificações. Nunca devolve o valor das chaves.
import { createECDH } from "node:crypto";
import { NextResponse, connection } from "next/server";
import { getLastCronRun } from "@/lib/push-store";

/** A chave pública corresponde à privada? Se não, o serviço de push recusa os envios. */
function vapidKeysMatch(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  try {
    const ecdh = createECDH("prime256v1");
    ecdh.setPrivateKey(Buffer.from(privateKey, "base64url"));
    return ecdh.getPublicKey("base64url") === publicKey;
  } catch {
    return false;
  }
}

export async function GET() {
  await connection();
  const subject = process.env.VAPID_SUBJECT ?? "";
  const checks = {
    vapidPublicKey: Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
    vapidPrivateKey: Boolean(process.env.VAPID_PRIVATE_KEY),
    vapidKeysMatch: vapidKeysMatch(),
    vapidSubject: /^(mailto:\S+@\S+|https:\/\/\S+)$/.test(subject) && !subject.includes("example.com"),
    cronSecret: Boolean(process.env.CRON_SECRET),
    redis: Boolean(
      (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL) &&
        (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN),
    ),
  };

  let lastCron: unknown = null;
  let redisReachable = true;
  try {
    lastCron = await getLastCronRun();
  } catch {
    redisReachable = false;
  }

  const ok = Object.values(checks).every(Boolean) && redisReachable;
  return NextResponse.json(
    { ok, ...checks, redisReachable, lastCron },
    { headers: { "Cache-Control": "no-store" } },
  );
}
