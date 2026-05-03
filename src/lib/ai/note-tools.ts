import { tool } from "ai";
import { z } from "zod";

import { db } from "@/lib/db";
import { isLocale } from "@/lib/i18n/locale";
import { log } from "@/lib/log";
import {
  attachTagsToNote,
  createNote,
  deleteNote as deleteNotePersist,
  listRecentNotes,
  searchNotes,
} from "@/lib/notes/persistence";
import { normalizeTagName } from "@/lib/notes/tags";
import { scheduleReminder } from "@/lib/reminders/schedule";

const NoteSourceSchema = z.enum([
  "TELEGRAM_TEXT",
  "TELEGRAM_VOICE",
  "TELEGRAM_PHOTO",
  "TELEGRAM_PDF",
  "WEB",
]);

export type NoteSourceLiteral = z.infer<typeof NoteSourceSchema>;

/**
 * Build the agent tool set. Tools are bound to a specific user + source so
 * the model can never write to a different account or invent provenance.
 */
export function buildNoteTools(opts: { userId: string; defaultSource: NoteSourceLiteral }) {
  return {
    saveNote: tool({
      description:
        "Save a new note. Always call this first when the user is recording something. Returns the created note id which you should use for any follow-up tag or reminder.",
      inputSchema: z.object({
        body: z.string().min(1).max(8000).describe("The note text in the user's own words."),
        occurredAt: z
          .string()
          .datetime()
          .optional()
          .describe("ISO-8601 UTC timestamp. Omit to use 'now'. Set this only if the user explicitly says the note refers to a past day."),
        source: NoteSourceSchema.optional().describe("Override the default source."),
      }),
      execute: async ({ body, occurredAt, source }) => {
        const note = await createNote({
          userId: opts.userId,
          body,
          source: source ?? opts.defaultSource,
          occurredAt: occurredAt ? new Date(occurredAt) : undefined,
        });
        return { id: note.id, occurredAt: note.occurredAt.toISOString() };
      },
    }),

    proposeTags: tool({
      description:
        "Apply one or more tags to a note that you previously saved. Tags are lowercase, no leading '#'. Use 1-3 short, semantically meaningful tags. The literal tag 'reminder' is reserved — only attach it if you also call setReminder.",
      inputSchema: z.object({
        noteId: z.string().describe("The note id returned by saveNote in this turn."),
        tags: z.array(z.string().min(1).max(32)).min(1).max(5),
      }),
      execute: async ({ noteId, tags }) => {
        const cleaned = Array.from(
          new Set(tags.map(normalizeTagName).filter((t) => t.length > 0)),
        );
        if (cleaned.length === 0) return { tags: [] };
        const applied = await attachTagsToNote(noteId, opts.userId, cleaned);
        return { tags: applied.map((t) => t.name) };
      },
    }),

    setReminder: tool({
      description:
        "Schedule a Telegram reminder for a previously saved note. Use this whenever the user expresses a date or time intent. dueAt must be a precise ISO-8601 UTC timestamp in the future.",
      inputSchema: z.object({
        noteId: z.string(),
        dueAt: z.string().datetime(),
        naturalText: z
          .string()
          .max(120)
          .optional()
          .describe("Echo of the natural-language phrase the user used."),
      }),
      execute: async ({ noteId, dueAt, naturalText }) => {
        const reminder = await scheduleReminder({
          userId: opts.userId,
          noteId,
          dueAt: new Date(dueAt),
          naturalText,
        });
        return { reminderId: reminder.id, dueAt: reminder.dueAt.toISOString() };
      },
    }),

    listRecentNotes: tool({
      description:
        "Return the user's most recent notes. Use this when the user asks for their journal, e.g. 'show my last notes'.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(20).default(10),
      }),
      execute: async ({ limit }) => {
        const notes = await listRecentNotes(opts.userId, limit);
        return notes.map((n) => ({
          id: n.id,
          body: n.body,
          occurredAt: n.occurredAt.toISOString(),
          tags: n.tags.map((t) => t.tag.name),
          reminderAt: n.reminder?.dueAt.toISOString() ?? null,
        }));
      },
    }),

    searchNotes: tool({
      description: "Search the user's notes by free-text and/or by a tag.",
      inputSchema: z.object({
        query: z.string().max(200).optional(),
        tag: z.string().max(32).optional(),
        limit: z.number().int().min(1).max(20).default(10),
      }),
      execute: async ({ query, tag, limit }) => {
        const notes = await searchNotes(opts.userId, { query, tag, limit });
        return notes.map((n) => ({
          id: n.id,
          body: n.body,
          occurredAt: n.occurredAt.toISOString(),
          tags: n.tags.map((t) => t.tag.name),
        }));
      },
    }),

    deleteNote: tool({
      description: "Delete a note. The `confirm` flag must be true.",
      inputSchema: z.object({
        id: z.string(),
        confirm: z.literal(true),
      }),
      execute: async ({ id }) => {
        const ok = await deleteNotePersist(opts.userId, id);
        return { deleted: ok };
      },
    }),

    setUserLocale: tool({
      description:
        "Persist the user's preferred reply language. Allowed values: en, es, pt, ar.",
      inputSchema: z.object({
        locale: z.string().min(2).max(5),
      }),
      execute: async ({ locale }) => {
        if (!isLocale(locale)) {
          log.warn("set_locale_unsupported", { locale });
          return { ok: false };
        }
        await db.user.update({
          where: { id: opts.userId },
          data: { locale },
        });
        return { ok: true, locale };
      },
    }),
  };
}
