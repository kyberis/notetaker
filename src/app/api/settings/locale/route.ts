import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { errors, withApi } from "@/lib/http";
import { isLocale } from "@/lib/i18n/locale";

const Schema = z.object({ locale: z.string().min(2).max(5) });

export async function POST(req: Request) {
  return withApi(async () => {
    const session = await requireSession();
    const body = Schema.parse(await req.json());
    if (!isLocale(body.locale)) throw errors.badRequest("Unsupported locale.");
    await db.user.update({
      where: { id: session.user.id },
      data: { locale: body.locale },
    });
    return NextResponse.json({ ok: true, locale: body.locale });
  });
}
