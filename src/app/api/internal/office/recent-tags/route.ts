import { NextRequest, NextResponse } from "next/server";

import { readOfficeUserLookup, requireIdpServiceToken } from "@/lib/office/idp-service-auth";
import { resolveOfficeUser } from "@/lib/office/resolve-office-user";
import { listRecentOfficeTags } from "@/lib/office/recent-office-tags";

export const dynamic = "force-dynamic";

/**
 * Warren Agent Office — recent investment note tags for trefolio AID.
 */
export async function GET(req: NextRequest) {
  const fail = requireIdpServiceToken(req);
  if (fail) return fail;

  const lookup = readOfficeUserLookup(req);
  const user = await resolveOfficeUser(lookup);
  if (!user) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const result = await listRecentOfficeTags(user.id);
  return NextResponse.json({
    available: true,
    tags: result.tags,
    excerpt: result.excerpt,
    noteDate: result.noteDate,
  });
}
