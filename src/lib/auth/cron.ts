import crypto from "node:crypto";

import { errors } from "@/lib/http";

/**
 * Verify a Vercel cron request. Vercel sends `Authorization: Bearer
 * <CRON_SECRET>` on every scheduled call. In dev (no `CRON_SECRET` set) we
 * accept the call so localhost manual tests still work.
 */
export function verifyCronRequest(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      throw errors.unauthorized("CRON_SECRET not configured.");
    }
    return;
  }
  const header = req.headers.get("authorization") ?? "";
  const got = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (got.length !== expected.length) throw errors.unauthorized();
  const ok = crypto.timingSafeEqual(Buffer.from(got, "utf8"), Buffer.from(expected, "utf8"));
  if (!ok) throw errors.unauthorized();
}
