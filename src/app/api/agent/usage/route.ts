import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { getAgentQuotaSnapshot } from "@/lib/agent-quota";
import { withApi } from "@/lib/http";

/** Today's agent quota snapshot for the signed-in user (Telegram + web share one counter). */
export async function GET() {
  return withApi(async () => {
    const session = await requireSession();
    const snapshot = await getAgentQuotaSnapshot(session.user.id);
    return NextResponse.json(snapshot);
  });
}
