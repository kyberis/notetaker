import { NextResponse } from "next/server";
import { z } from "zod";

import { hashPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { errors, withApi } from "@/lib/http";
import { CURRENT_TERMS_VERSION } from "@/lib/legal";
import { sendVerificationEmail } from "@/lib/mail/verification";
import { buildRateLimiter, enforceLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

const Schema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  name: z.string().max(120).optional(),
  acceptTerms: z.literal(true),
  turnstileToken: z.string().min(1).optional(),
  locale: z.string().min(2).max(5).optional(),
});

const limiter = buildRateLimiter({ prefix: "register", limit: 5, windowSeconds: 600 });

export async function POST(req: Request) {
  return withApi(async () => {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const limit = await enforceLimit({ limiter, identifier: ip, context: "register" });
    if (!limit.ok) throw errors.tooMany();

    const body = Schema.parse(await req.json());

    const captchaOk = await verifyTurnstile(body.turnstileToken, ip);
    if (!captchaOk) throw errors.badRequest("Captcha failed.");

    const email = body.email.toLowerCase();
    const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      // Don't leak account existence — return 200 and let them check email.
      return NextResponse.json({ ok: true });
    }

    const hash = await hashPassword(body.password);
    const user = await db.user.create({
      data: {
        email,
        passwordHash: hash,
        name: body.name,
        locale: body.locale ?? "en",
        acceptedTermsAt: new Date(),
        acceptedTermsVersion: CURRENT_TERMS_VERSION,
      },
      select: { id: true, email: true, locale: true },
    });

    await sendVerificationEmail(user.id, user.email, user.locale);
    return NextResponse.json({ ok: true });
  });
}
