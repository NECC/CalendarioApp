// Guarda os dispositivos que recebem avisos e as estrelas de cada um.
// Na Vercel usa o Redis, porque a memória do servidor se perde entre pedidos.
// Em desenvolvimento local, sem Redis, usa a memória.
import "server-only";
import { Redis } from "@upstash/redis";
import type { PushSubscription } from "web-push";

export interface StoredSubscription {
  /** Endereço do dispositivo, gerado pelo browser. */
  subscription: PushSubscription;
  /** IDs dos testes com estrela. */
  starred: string[];
}

/** Resultado de uma execução do cron, mostrado em /api/push/health. */
export interface CronRun {
  at: string;
  path: string;
  [detail: string]: unknown;
}

const SUBSCRIPTIONS_KEY = "push:subscriptions";
const CRON_RUNS_KEY = "push:cron-runs";
const MAX_CRON_RUNS = 15;
const DELIVERED_TTL_SECONDS = 3 * 24 * 60 * 60;

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

if (!redis && process.env.VERCEL) {
  console.warn("[push] Sem Redis: os dispositivos registados vão perder-se.");
}

// Alternativa em memória. Fica em globalThis para sobreviver aos recarregamentos do `next dev`.
interface MemoryStore {
  subscriptions: Map<string, StoredSubscription>;
  delivered: Set<string>;
  cronRuns: CronRun[];
}
const globals = globalThis as { __pushMemory?: MemoryStore };
const memory: MemoryStore = (globals.__pushMemory ??= {
  subscriptions: new Map(),
  delivered: new Set(),
  cronRuns: [],
});

// ---- Dispositivos ----

export async function saveSubscription(entry: StoredSubscription) {
  const endpoint = entry.subscription.endpoint;
  if (redis) await redis.hset(SUBSCRIPTIONS_KEY, { [endpoint]: entry });
  else memory.subscriptions.set(endpoint, entry);
}

export async function getSubscription(endpoint: string): Promise<StoredSubscription | null> {
  if (redis) return redis.hget<StoredSubscription>(SUBSCRIPTIONS_KEY, endpoint);
  return memory.subscriptions.get(endpoint) ?? null;
}

export async function deleteSubscription(endpoint: string) {
  if (redis) await redis.hdel(SUBSCRIPTIONS_KEY, endpoint);
  else memory.subscriptions.delete(endpoint);
}

export async function getAllSubscriptions(): Promise<StoredSubscription[]> {
  if (redis) {
    const all = await redis.hgetall<Record<string, StoredSubscription>>(SUBSCRIPTIONS_KEY);
    return all ? Object.values(all) : [];
  }
  return [...memory.subscriptions.values()];
}

// ---- Avisos entregues hoje: evita repetições quando o cron corre mais de uma vez ----

/** Reserva o envio de hoje para este dispositivo. Devolve false se já foi feito. */
export async function claimDelivery(date: string, endpoint: string): Promise<boolean> {
  const key = `push:delivered:${date}`;
  if (redis) {
    const added = await redis.sadd(key, endpoint);
    if (added) await redis.expire(key, DELIVERED_TTL_SECONDS);
    return added === 1;
  }
  const member = `${key}:${endpoint}`;
  if (memory.delivered.has(member)) return false;
  memory.delivered.add(member);
  return true;
}

/** Liberta a reserva, para o próximo cron tentar outra vez. */
export async function releaseDelivery(date: string, endpoint: string) {
  const key = `push:delivered:${date}`;
  if (redis) await redis.srem(key, endpoint);
  else memory.delivered.delete(`${key}:${endpoint}`);
}

// ---- Últimas execuções do cron ----

/** Uma falha aqui nunca faz o cron falhar. */
export async function recordCronRun(run: CronRun) {
  try {
    if (redis) {
      await redis.lpush(CRON_RUNS_KEY, run);
      await redis.ltrim(CRON_RUNS_KEY, 0, MAX_CRON_RUNS - 1);
    } else {
      memory.cronRuns = [run, ...memory.cronRuns].slice(0, MAX_CRON_RUNS);
    }
  } catch (err) {
    console.error("[push] não foi possível guardar a execução:", err);
  }
}

/** Execuções mais recentes primeiro. */
export async function getRecentCronRuns(): Promise<CronRun[]> {
  if (redis) return redis.lrange<CronRun>(CRON_RUNS_KEY, 0, MAX_CRON_RUNS - 1);
  return memory.cronRuns;
}
