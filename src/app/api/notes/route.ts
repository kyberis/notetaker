import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { withApi } from "@/lib/http";
import {
  createNote,
  listRecentNotes,
  searchNotes,
} from "@/lib/notes/persistence";

const QuerySchema = z.object({
  q: z.string().max(200).optional(),
  tag: z.string().max(32).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export async function GET(req: Request) {
  return withApi(async () => {
    const session = await requireSession();
    const url = new URL(req.url);
    const { q, tag, limit } = QuerySchema.parse(Object.fromEntries(url.searchParams));
    const notes =
      q || tag
        ? await searchNotes(session.user.id, { query: q, tag, limit: limit ?? 20 })
        : await listRecentNotes(session.user.id, limit ?? 20);
    return NextResponse.json({
      notes: notes.map((n) => ({
        id: n.id,
        body: n.body,
        source: n.source,
        occurredAt: n.occurredAt.toISOString(),
        createdAt: n.createdAt.toISOString(),
        tags: n.tags.map((t) => t.tag.name),
        reminderAt: n.reminder?.dueAt.toISOString() ?? null,
      })),
    });
  });
}

const CreateSchema = z.object({
  body: z.string().min(1, "Note body is required").max(8000),
  occurredAt: z.string().datetime().optional(),
  tags: z
    .array(z.string().min(1).max(32))
    .max(10)
    .optional(),
});

export async function POST(req: Request) {
  return withApi(async () => {
    const session = await requireSession();
    const json = await req.json().catch(() => ({}));
    const input = CreateSchema.parse(json);
    const note = await createNote({
      userId: session.user.id,
      body: input.body,
      source: "WEB",
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : undefined,
      tagNames: input.tags,
    });
    return NextResponse.json(
      {
        note: {
          id: note.id,
          body: note.body,
          source: note.source,
          occurredAt: note.occurredAt.toISOString(),
          createdAt: note.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  });
}
