import { db } from "@/lib/db";

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

function utcDay(now: Date): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return d;
}

/** Today at 00:00 UTC (same boundary as `AgentMessageUsage.day`). */
export function getTodayUtcDate(now: Date = new Date()): Date {
  return utcDay(now);
}

/** Next midnight UTC — when the daily counter resets. */
function getResetAtUtc(now: Date = new Date()): string {
  const today = getTodayUtcDate(now);
  return new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Read-only snapshot for `/api/agent/usage` and the web UI badge. Does not
 * increment the counter. Telegram and (future) web agent share this bucket.
 */
export async function getAgentQuotaSnapshot(userId: string): Promise<AgentQuotaSnapshot> {
  const [user, row] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { dailyAgentMessageLimit: true },
    }),
    db.agentMessageUsage.findUnique({
      where: { userId_day: { userId, day: getTodayUtcDate() } },
      select: { count: true },
    }),
  ]);
  const limit = user?.dailyAgentMessageLimit ?? 30;
  const used = row?.count ?? 0;
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    resetAtUtc: getResetAtUtc(),
  };
}

/**
 * Increment the user's daily agent counter. Returns whether the user is
 * still within quota AFTER the increment — callers should bail out if `ok`
 * is false. Atomically upserts the row and reads back the new count.
 */
export async function consumeAgentQuota(userId: string, now: Date = new Date()): Promise<QuotaResult> {
  const day = getTodayUtcDate(now);
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { dailyAgentMessageLimit: true },
  });
  if (!user) return { ok: false, count: 0, limit: 0 };

  const updated = await db.agentMessageUsage.upsert({
    where: { userId_day: { userId, day } },
    create: { userId, day, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  });

  return {
    ok: updated.count <= user.dailyAgentMessageLimit,
    count: updated.count,
    limit: user.dailyAgentMessageLimit,
  };
}

export async function recordAgentTokens(userId: string, opts: { input?: number; output?: number; now?: Date }) {
  const now = opts.now ?? new Date();
  const day = getTodayUtcDate(now);
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
