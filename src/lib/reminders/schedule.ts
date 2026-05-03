import { db } from "@/lib/db";
import { errors } from "@/lib/http";

import { REMINDER_TAG_NAME } from "@/lib/notes/tags";
import { attachTagsToNote } from "@/lib/notes/persistence";

export type ScheduleReminderInput = {
  userId: string;
  noteId: string;
  /** UTC instant when the reminder is due. */
  dueAt: Date;
  /** The natural-language phrase the user uttered ("tomorrow at 9am"). */
  naturalText?: string;
};

/**
 * Create a reminder row attached to a note. Idempotent: if a reminder
 * already exists for this note we update its `dueAt` rather than creating
 * a duplicate (one note = one reminder by design).
 */
export async function scheduleReminder(input: ScheduleReminderInput) {
  if (input.dueAt.getTime() <= Date.now()) {
    throw errors.badRequest("Reminder must be in the future.");
  }

  // Confirm the note belongs to the user — never trust a noteId from the AI tool.
  const note = await db.note.findFirst({
    where: { id: input.noteId, userId: input.userId },
    select: { id: true },
  });
  if (!note) throw errors.notFound("Note not found.");

  const reminder = await db.reminder.upsert({
    where: { noteId: input.noteId },
    create: {
      userId: input.userId,
      noteId: input.noteId,
      dueAt: input.dueAt,
      naturalText: input.naturalText,
      status: "PENDING",
    },
    update: {
      dueAt: input.dueAt,
      naturalText: input.naturalText,
      status: "PENDING",
      attempts: 0,
      sentAt: null,
      cancelledAt: null,
      failedAt: null,
    },
  });

  // Auto-tag the note as a reminder.
  await attachTagsToNote(input.noteId, input.userId, [REMINDER_TAG_NAME]);

  return reminder;
}

export async function cancelReminder(userId: string, noteId: string) {
  const result = await db.reminder.updateMany({
    where: { noteId, userId, status: "PENDING" },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });
  return result.count > 0;
}
