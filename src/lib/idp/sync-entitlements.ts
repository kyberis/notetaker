import { db } from "@/lib/db";
import { shouldSendUsersToUnifiedIdp } from "@/lib/idp-base";

const IDP_FETCH_TIMEOUT_MS = 12_000;

/**
 * Pull `will_daily_limit` from user.trefolio.com into `dailyAgentMessageLimit`.
 */
export async function syncEntitlementsFromIdpForUser(userId: string): Promise<void> {
  if (!shouldSendUsersToUnifiedIdp()) return;

  const base = process.env.IDP_BASE_URL?.trim().replace(/\/+$/, "");
  const svc = process.env.IDP_SERVICE_TOKEN?.trim();
  if (!base || !svc) return;

  const link = await db.account.findFirst({
    where: { userId, provider: "trefolio-id" },
    select: { providerAccountId: true },
  });
  const idpSub = link?.providerAccountId?.trim();
  if (!idpSub) return;

  const res = await fetch(`${base}/v1/entitlements/${encodeURIComponent(idpSub)}`, {
    headers: { Authorization: `Bearer ${svc}` },
    signal: AbortSignal.timeout(IDP_FETCH_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) return;

  const data = (await res.json()) as {
    entitlements?: { will_daily_limit?: number };
  };
  const limit = Number(data.entitlements?.will_daily_limit) || 30;

  await db.user.update({
    where: { id: userId },
    data: { dailyAgentMessageLimit: limit },
  });
}
