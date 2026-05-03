import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { withApi } from "@/lib/http";
import { listRecentNotes, searchNotes } from "@/lib/notes/persistence";

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
