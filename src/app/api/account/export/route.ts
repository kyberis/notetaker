import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { withApi } from "@/lib/http";

export async function GET() {
  return withApi(async () => {
    const session = await requireSession();
    const userId = session.user.id;

    const [user, notes, tags, reminders] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          locale: true,
          createdAt: true,
          telegramUsername: true,
          telegramVerifiedAt: true,
          acceptedTermsAt: true,
          acceptedTermsVersion: true,
        },
      }),
      db.note.findMany({
        where: { userId },
        orderBy: { occurredAt: "asc" },
        include: { tags: { include: { tag: { select: { name: true } } } } },
      }),
      db.tag.findMany({
        where: { userId },
        orderBy: { name: "asc" },
        select: { name: true, isReminderTag: true, createdAt: true },
      }),
      db.reminder.findMany({
        where: { userId },
        orderBy: { dueAt: "asc" },
        select: { id: true, noteId: true, dueAt: true, naturalText: true, status: true },
      }),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      user,
      notes: notes.map((n) => ({
        id: n.id,
        body: n.body,
        source: n.source,
        occurredAt: n.occurredAt.toISOString(),
        createdAt: n.createdAt.toISOString(),
        tags: n.tags.map((t) => t.tag.name),
      })),
      tags,
      reminders: reminders.map((r) => ({ ...r, dueAt: r.dueAt.toISOString() })),
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "content-disposition": `attachment; filename=will-export-${userId}.json`,
      },
    });
  });
}
