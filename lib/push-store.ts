// Subscrições push: Upstash Redis na Vercel, memória em desenvolvimento local.
import "server-only";
import { Redis } from "@upstash/redis";
import type { PushSubscription } from "web-push";

export interface Preferences {
  /** Anos inteiros (0 = eventos gerais). Vazio + subjects vazio = tudo. */
  years: number[];
  /** Siglas das UCs (ver lib/subjects.ts). */
  subjects: string[];
  /** IDs dos testes com estrela. */
  starred: string[];
}

export interface StoredSubscription extends Preferences {
  subscription: PushSubscription;
  createdAt: string;
}

export interface CronRun {
  at: string;
  path: string;
  [detail: string]: unknown;
}

const HASH_KEY = "push:subscriptions";
const LAST_CRON_KEY = "push:last-cron";
const DELIVERED_TTL_SECONDS = 3 * 24 * 60 * 60;

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

if (!redis && process.env.VERCEL) {
  // Na Vercel cada pedido pode correr numa instância diferente: a memória não serve.
  console.warn("[push-store] Sem Redis configurado — as subscrições não vão persistir!");
}

// Em globalThis para sobreviver ao hot-reload do `next dev`.
const memory: Map<string, StoredSubscription> =
  ((globalThis as Record<string, unknown>).__pushMemory as Map<string, StoredSubscription>) ??
  ((globalThis as Record<string, unknown>).__pushMemory = new Map());
const memoryDelivered: Set<string> =
  ((globalThis as Record<string, unknown>).__pushDelivered as Set<string>) ??
  ((globalThis as Record<string, unknown>).__pushDelivered = new Set());
let memoryLastCron: CronRun | null = null;

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

/** Reserva o envio de hoje para este dispositivo. Devolve false se já tiver sido feito. */
export async function claimDelivery(date: string, endpoint: string): Promise<boolean> {
  const key = `push:delivered:${date}`;
  if (redis) {
    const added = await redis.sadd(key, endpoint);
    if (added) await redis.expire(key, DELIVERED_TTL_SECONDS);
    return added === 1;
  }
  const member = `${key}:${endpoint}`;
  if (memoryDelivered.has(member)) return false;
  memoryDelivered.add(member);
  return true;
}

export async function releaseDelivery(date: string, endpoint: string) {
  const key = `push:delivered:${date}`;
  if (redis) await redis.srem(key, endpoint);
  else memoryDelivered.delete(`${key}:${endpoint}`);
}

/** Guarda a última execução para /api/push/health. Nunca faz o cron falhar. */
export async function recordCronRun(run: CronRun) {
  try {
    if (redis) await redis.set(LAST_CRON_KEY, run);
    else memoryLastCron = run;
  } catch (err) {
    console.error("[push-store] não foi possível guardar a execução:", err);
  }
}

export async function getLastCronRun(): Promise<CronRun | null> {
  if (redis) return redis.get<CronRun>(LAST_CRON_KEY);
  return memoryLastCron;
}
