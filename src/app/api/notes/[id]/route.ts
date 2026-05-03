import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { errors, withApi } from "@/lib/http";
import { deleteNote, updateNote } from "@/lib/notes/persistence";

const IdSchema = z.string().min(1).max(64);

const UpdateSchema = z
  .object({
    body: z.string().min(1).max(8000).optional(),
    occurredAt: z.string().datetime().optional(),
    tags: z.array(z.string().min(1).max(32)).max(10).optional(),
  })
  .refine(
    (v) => v.body !== undefined || v.occurredAt !== undefined || v.tags !== undefined,
    { message: "At least one field is required." },
  );

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  return withApi(async () => {
    const session = await requireSession();
    const { id } = await ctx.params;
    const noteId = IdSchema.parse(id);
    const input = UpdateSchema.parse(await req.json().catch(() => ({})));

    const note = await updateNote(session.user.id, noteId, {
      body: input.body,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : undefined,
      tagNames: input.tags,
    });
    if (!note) throw errors.notFound("Note not found.");

    return NextResponse.json({
      note: {
        id: note.id,
        body: note.body,
        source: note.source,
        occurredAt: note.occurredAt.toISOString(),
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
        tags: note.tags.map((t) => t.tag.name),
        reminderAt: note.reminder?.dueAt.toISOString() ?? null,
      },
    });
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  return withApi(async () => {
    const session = await requireSession();
    const { id } = await ctx.params;
    const noteId = IdSchema.parse(id);
    const ok = await deleteNote(session.user.id, noteId);
    if (!ok) throw errors.notFound("Note not found.");
    return NextResponse.json({ deleted: true });
  });
}
