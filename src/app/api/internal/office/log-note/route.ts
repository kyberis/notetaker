import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createOfficeNote } from "@/lib/office/create-office-note";
import { readOfficeUserLookup, requireIdpServiceToken } from "@/lib/office/idp-service-auth";
import { resolveOfficeUser } from "@/lib/office/resolve-office-user";

export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    sub: z.string().optional(),
    email: z.string().optional(),
    trefolioUserId: z.string().optional(),
    text: z.string().min(1).max(12_000),
  })
  .strict();

/**
 * Warren Agent Office — log an investing decision note.
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

  const result = await createOfficeNote(user.id, body.text);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: result.message, noteId: result.noteId });
}
