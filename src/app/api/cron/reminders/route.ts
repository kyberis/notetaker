import { NextResponse } from "next/server";

import { verifyCronRequest } from "@/lib/auth/cron";
import { withApi } from "@/lib/http";
import { dispatchDueReminders } from "@/lib/reminders/dispatch";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  return withApi(async () => {
    verifyCronRequest(req);
    const stats = await dispatchDueReminders();
    log.info("cron_reminders_done", stats);
    return NextResponse.json(stats);
  });
}
