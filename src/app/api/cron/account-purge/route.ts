import { NextResponse } from "next/server";

import { verifyCronRequest } from "@/lib/auth/cron";
import { purgeExpiredAccounts } from "@/lib/account-deletion";
import { withApi } from "@/lib/http";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  return withApi(async () => {
    verifyCronRequest(req);
    const purged = await purgeExpiredAccounts();
    log.info("cron_account_purge_done", { purged });
    return NextResponse.json({ purged });
  });
}
