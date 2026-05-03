import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { log } from "@/lib/log";

let cachedRedis: Redis | null = null;

function getRedis(): Redis | null {
  if (cachedRedis) return cachedRedis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  cachedRedis = new Redis({ url, token });
  return cachedRedis;
}

/**
 * Returns a Ratelimit configured against Upstash, or null when env vars are
 * missing. Callers must treat null as "fail open" (no limiting) and decide
 * whether that's acceptable for their endpoint.
 */
export function buildRateLimiter(opts: {
  prefix: string;
  limit: number;
  windowSeconds: number;
}): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    prefix: opts.prefix,
    limiter: Ratelimit.slidingWindow(opts.limit, `${opts.windowSeconds} s`),
    analytics: false,
  });
}

/**
 * Convenience wrapper: enforces the limit if Redis is configured, otherwise
 * passes through. Logs a structured warning when limit is hit.
 */
export async function enforceLimit(opts: {
  limiter: Ratelimit | null;
  identifier: string;
  context?: string;
}): Promise<{ ok: true } | { ok: false; reset: number }> {
  if (!opts.limiter) return { ok: true };
  const res = await opts.limiter.limit(opts.identifier);
  if (!res.success) {
    log.warn("rate_limit_exceeded", {
      context: opts.context,
      identifier: opts.identifier,
      reset: res.reset,
    });
    return { ok: false, reset: res.reset };
  }
  return { ok: true };
}
