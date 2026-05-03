import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { withApi } from "@/lib/http";
import { CURRENT_TERMS_VERSION } from "@/lib/legal";

export async function POST() {
  return withApi(async () => {
    const session = await requireSession();
    await db.user.update({
      where: { id: session.user.id },
      data: {
        acceptedTermsAt: new Date(),
        acceptedTermsVersion: CURRENT_TERMS_VERSION,
      },
    });
    return NextResponse.json({ ok: true });
  });
}
