import { NextResponse } from "next/server";

import { verifyCronRequest } from "@/lib/auth/cron";
import { sendDeletionReminders } from "@/lib/account-deletion";
import { withApi } from "@/lib/http";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  return withApi(async () => {
    verifyCronRequest(req);
    const stats = await sendDeletionReminders();
    log.info("cron_deletion_reminders_done", stats);
    return NextResponse.json(stats);
  });
}
