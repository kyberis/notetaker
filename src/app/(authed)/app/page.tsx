import Link from "next/link";

import { pageRequireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n/locale";
import { bucketByDay } from "@/lib/notes/day-bucket";

import { NoteCard } from "@/components/notes/note-card";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const { user, locale } = await pageRequireAuth();

  const tgUser = await db.user.findUnique({
    where: { id: user.id },
    select: { telegramVerifiedAt: true },
  });

  const notes = await db.note.findMany({
    where: { userId: user.id },
    orderBy: { occurredAt: "desc" },
    take: 200,
    include: {
      tags: { include: { tag: { select: { name: true, isReminderTag: true } } } },
      reminder: { select: { dueAt: true, status: true } },
    },
  });

  const userLocale: Locale = isLocale(locale) ? locale : "en";
  const buckets = bucketByDay(notes, userLocale);

  return (
    <div className="max-w-3xl mx-auto">
      {!tgUser?.telegramVerifiedAt ? (
        <div className="mb-6 rounded-lg border bg-secondary/50 p-4">
          <p className="text-sm">
            Connect Telegram to start saving notes.
            <Link href="/settings/telegram" className="ml-1 underline">
              Open settings
            </Link>
            .
          </p>
        </div>
      ) : null}

      {notes.length === 0 ? (
        <div className="rounded-lg border p-10 text-center">
          <h2 className="text-lg font-semibold">No notes yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Open Telegram and message Will. Anything you send becomes a note.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {buckets.map((b) => (
            <section key={b.key}>
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                {b.label}
              </h2>
              <ul className="space-y-3">
                {b.notes.map((n) => (
                  <li key={n.id}>
                    <NoteCard
                      body={n.body}
                      occurredAt={n.occurredAt}
                      source={n.source}
                      tags={n.tags.map((t) => t.tag.name)}
                      reminderAt={n.reminder?.dueAt ?? null}
                      reminderStatus={n.reminder?.status ?? null}
                      locale={userLocale}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
