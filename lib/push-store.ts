// =============================================================
// Onde guardamos quem quer receber notificações e de quê.
//
// - Na Vercel: Upstash Redis (adicionado pelo Marketplace da Vercel, que
//   cria sozinho as variáveis KV_REST_API_URL / KV_REST_API_TOKEN).
// - Em local, sem essas variáveis: guardamos em memória (perde-se ao
//   reiniciar o `npm run dev`, mas chega para testar).
//
// Guardamos tudo num único "hash" do Redis:
//   chave do hash = endpoint da subscription (único por dispositivo)
//   valor         = { subscription, years, subjects, createdAt }
// =============================================================
import "server-only";
import { Redis } from "@upstash/redis";
import type { PushSubscription } from "web-push";

export interface Preferences {
  /** Anos inteiros (0 = eventos gerais). Vazio + subjects vazio = tudo. */
  years: number[];
  /** Siglas das UCs (ver lib/subjects.ts). */
  subjects: string[];
}

export interface StoredSubscription extends Preferences {
  subscription: PushSubscription;
  createdAt: string;
}

const HASH_KEY = "push:subscriptions";

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

if (!redis && process.env.VERCEL) {
  // Na Vercel sem Redis, cada pedido pode correr numa máquina diferente,
  // por isso a memória NÃO serve. Avisamos nos logs.
  console.warn("[push-store] Sem Redis configurado — as subscrições não vão persistir!");
}

// Guardado em globalThis para sobreviver ao hot-reload do `next dev`.
const memory: Map<string, StoredSubscription> =
  ((globalThis as Record<string, unknown>).__pushMemory as Map<string, StoredSubscription>) ??
  ((globalThis as Record<string, unknown>).__pushMemory = new Map());

export async function saveSubscription(entry: StoredSubscription) {
  if (redis) await redis.hset(HASH_KEY, { [entry.subscription.endpoint]: entry });
  else memory.set(entry.subscription.endpoint, entry);
}

export async function getSubscription(endpoint: string): Promise<StoredSubscription | null> {
  if (redis) return (await redis.hget<StoredSubscription>(HASH_KEY, endpoint)) ?? null;
  return memory.get(endpoint) ?? null;
}

export async function deleteSubscription(endpoint: string) {
  if (redis) await redis.hdel(HASH_KEY, endpoint);
  else memory.delete(endpoint);
}

export async function getAllSubscriptions(): Promise<StoredSubscription[]> {
  if (redis) {
    const all = await redis.hgetall<Record<string, StoredSubscription>>(HASH_KEY);
    return all ? Object.values(all) : [];
  }
  return [...memory.values()];
}
