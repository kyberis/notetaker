import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { readOfficeUserLookup, requireIdpServiceToken } from "@/lib/office/idp-service-auth";
import { resolveOfficeUser } from "@/lib/office/resolve-office-user";
import { searchOfficeNotes } from "@/lib/office/search-office-notes";

export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    sub: z.string().optional(),
    email: z.string().optional(),
    trefolioUserId: z.string().optional(),
    query: z.string().min(1).max(500),
  })
  .strict();

/**
 * Warren Agent Office — search user notes for coordination context.
 */
export async function POST(req: NextRequest) {
  const fail = requireIdpServiceToken(req);
  if (fail) return fail;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const lookup = readOfficeUserLookup(req, body);
  const user = await resolveOfficeUser(lookup);
  if (!user) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const hit = await searchOfficeNotes(user.id, body.query);
  if (!hit) {
    return NextResponse.json({});
  }

  return NextResponse.json(hit);
}
