import {
  consumeQuota,
  getUtcDay,
  peekQuota,
  type QuotaPort,
} from "@kyberis/agent-os/runtime";

import { db } from "@/lib/db";

/**
 * Daily agent message quota. Telegram and the web agent share one bucket.
 *
 * The day-boundary and over-limit arithmetic come from
 * `@kyberis/agent-os/runtime`; this file is only the Prisma half. Keeping the
 * verdict logic shared is what stops Will and Clara from disagreeing about
 * whether the message that lands exactly on the limit is served.
 */

const DEFAULT_DAILY_LIMIT = 30;

export type QuotaResult = {
  ok: boolean;
  count: number;
  limit: number;
};

export type AgentQuotaSnapshot = {
  used: number;
  limit: number;
  remaining: number;
  resetAtUtc: string;
};

/** Today at 00:00 UTC (same boundary as `AgentMessageUsage.day`). */
export function getTodayUtcDate(now: Date = new Date()): Date {
  return getUtcDay(now);
}

const port: QuotaPort = {
  async getLimit(userId) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { dailyAgentMessageLimit: true },
    });
    return user?.dailyAgentMessageLimit ?? DEFAULT_DAILY_LIMIT;
  },

  async getCount(userId, day) {
    const row = await db.agentMessageUsage.findUnique({
      where: { userId_day: { userId, day } },
      select: { count: true },
    });
    return row?.count ?? 0;
  },

  // Upsert-and-read-back so two Telegram updates arriving together cannot both
  // slip past the limit.
  async increment(userId, day) {
    const updated = await db.agentMessageUsage.upsert({
      where: { userId_day: { userId, day } },
      create: { userId, day, count: 1 },
      update: { count: { increment: 1 } },
      select: { count: true },
    });
    return updated.count;
  },
};

/**
 * Read-only snapshot for `/api/agent/usage` and the web UI badge. Does not
 * increment the counter.
 */
export async function getAgentQuotaSnapshot(userId: string): Promise<AgentQuotaSnapshot> {
  const verdict = await peekQuota(port, userId);
  return {
    used: verdict.count,
    limit: verdict.limit,
    remaining: verdict.remaining,
    resetAtUtc: verdict.resetAtUtc,
  };
}

/**
 * Increment the user's daily agent counter. Returns whether the user is still
 * within quota AFTER the increment — callers should bail out if `ok` is false.
 */
export async function consumeAgentQuota(
  userId: string,
  now: Date = new Date(),
): Promise<QuotaResult> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) return { ok: false, count: 0, limit: 0 };

  const verdict = await consumeQuota(port, userId, now);
  return { ok: verdict.ok, count: verdict.count, limit: verdict.limit };
}

export async function recordAgentTokens(
  userId: string,
  opts: { input?: number; output?: number; now?: Date },
) {
  const day = getTodayUtcDate(opts.now ?? new Date());
  await db.agentMessageUsage.upsert({
    where: { userId_day: { userId, day } },
    create: {
      userId,
      day,
      count: 0,
      inputTokens: opts.input ?? 0,
      outputTokens: opts.output ?? 0,
    },
    update: {
      inputTokens: { increment: opts.input ?? 0 },
      outputTokens: { increment: opts.output ?? 0 },
    },
  });
}
