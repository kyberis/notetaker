import { db } from "@/lib/db";

export type QuotaResult = {
  ok: boolean;
  count: number;
  limit: number;
};

function utcDay(now: Date): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return d;
}

/**
 * Increment the user's daily agent counter. Returns whether the user is
 * still within quota AFTER the increment — callers should bail out if `ok`
 * is false. Atomically upserts the row and reads back the new count.
 */
export async function consumeAgentQuota(userId: string, now: Date = new Date()): Promise<QuotaResult> {
  const day = utcDay(now);
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
  const day = utcDay(now);
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
