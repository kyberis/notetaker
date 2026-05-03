import { NextResponse } from "next/server";

import { softDeleteUser } from "@/lib/account-deletion";
import { requireSession } from "@/lib/auth/session";
import { withApi } from "@/lib/http";

export async function POST() {
  return withApi(async () => {
    const session = await requireSession();
    await softDeleteUser(session.user.id);
    return NextResponse.json({ ok: true });
  });
}
