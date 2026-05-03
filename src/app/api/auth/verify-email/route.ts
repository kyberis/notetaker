import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { errors, withApi } from "@/lib/http";
import {
  markVerificationTokenConsumed,
  verifyVerificationToken,
} from "@/lib/mail/verification";

const Schema = z.object({ token: z.string().min(10) });

export async function GET(req: Request) {
  return withApi(async () => {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const parsed = Schema.parse({ token });

    const result = await verifyVerificationToken(parsed.token);
    if (!result.ok) {
      throw errors.badRequest(`Verification ${result.reason}.`);
    }

    await markVerificationTokenConsumed(result.jti, result.userId);
    await db.user.update({
      where: { id: result.userId },
      data: { emailVerified: new Date() },
    });

    const base = process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    return NextResponse.redirect(`${base}/login?verified=1`, 303);
  });
}
