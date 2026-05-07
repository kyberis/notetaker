import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { buildIdpUpgradeUrlForWill, shouldSendUsersToUnifiedIdp } from "@/lib/idp-base";
import { errors, withApi } from "@/lib/http";

/**
 * Returns `{ url }` to the unified IdP checkout page (`user.trefolio.com/upgrade`).
 */
export async function POST(request: Request) {
  return withApi(async () => {
    await requireSession();

    if (!shouldSendUsersToUnifiedIdp()) {
      throw errors.serviceUnavailable("Unified billing is not enabled.");
    }

    let interval: "monthly" | "annual" = "monthly";
    try {
      const body = (await request.json()) as { interval?: string };
      if (body.interval === "annual") interval = "annual";
    } catch {
      /* default monthly */
    }

    const url = buildIdpUpgradeUrlForWill(null, { interval });
    return NextResponse.json({ url });
  });
}
