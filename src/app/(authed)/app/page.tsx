import { pageRequireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n/locale";
import { bucketByDay } from "@/lib/notes/day-bucket";

import { TelegramLinkPrompt } from "@/components/home/telegram-link-prompt";
import { EditableNoteCard } from "@/components/notes/editable-note-card";
import { NoteComposer } from "@/components/notes/note-composer";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const { user, locale } = await pageRequireAuth();
  const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? null;

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
    <div className="max-w-3xl mx-auto space-y-6">
      {botUsername && !tgUser?.telegramVerifiedAt ? <TelegramLinkPrompt /> : null}

      <NoteComposer />

      {notes.length === 0 ? (
        <div className="rounded-lg border p-10 text-center">
          <h2 className="text-lg font-semibold">No notes yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Write your first one above, or message Will on Telegram.
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
                    <EditableNoteCard
                      id={n.id}
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
