import { NextResponse } from "next/server";
import { z } from "zod";

import { getOptionalSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { errors, withApi } from "@/lib/http";
import { buildRateLimiter, enforceLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

const Schema = z.object({
  kind: z.enum(["PRIVACY", "ABUSE", "BUG", "GENERAL"]).default("GENERAL"),
  name: z.string().min(1).max(120),
  email: z.string().email().max(254),
  body: z.string().min(10).max(8000),
  turnstileToken: z.string().min(1).optional(),
});

const limiter = buildRateLimiter({ prefix: "contact", limit: 5, windowSeconds: 600 });

export async function POST(req: Request) {
  return withApi(async () => {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const limit = await enforceLimit({ limiter, identifier: ip, context: "contact" });
    if (!limit.ok) throw errors.tooMany();

    const body = Schema.parse(await req.json());
    const captchaOk = await verifyTurnstile(body.turnstileToken, ip);
    if (!captchaOk) throw errors.badRequest("Captcha failed.");

    const session = await getOptionalSession();
    await db.contactMessage.create({
      data: {
        kind: body.kind,
        name: body.name,
        email: body.email.toLowerCase(),
        body: body.body,
        userId: session?.user.id,
        ip,
        userAgent: req.headers.get("user-agent")?.slice(0, 500),
      },
    });
    return NextResponse.json({ ok: true });
  });
}
