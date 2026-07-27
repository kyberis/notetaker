import { tool } from "ai";
import type { Proposal } from "@kyberis/agent-os/safety";
import { z } from "zod";

import { db } from "@/lib/db";
import { isLocale } from "@/lib/i18n/locale";
import { log } from "@/lib/log";
import {
  attachTagsToNote,
  createNote,
  listRecentNotes,
  searchNotes,
  updateNote as updateNotePersist,
} from "@/lib/notes/persistence";
import { normalizeTagName } from "@/lib/notes/tags";
import { scheduleReminder } from "@/lib/reminders/schedule";
import {
  buildDeletePreview,
  type WillProposalKind,
} from "@/lib/safety/proposal-registry";

const NoteSourceSchema = z.enum([
  "TELEGRAM_TEXT",
  "TELEGRAM_VOICE",
  "TELEGRAM_PHOTO",
  "TELEGRAM_PDF",
  "WEB",
]);

export type NoteSourceLiteral = z.infer<typeof NoteSourceSchema>;

/**
 * Raise a proposal for a write that needs the user's approval. Supplied by the
 * caller because only the caller knows which conversation the confirmation
 * card will be delivered to. Returns `null` when the payload does not validate.
 */
export type RaiseProposal = (input: {
  kind: WillProposalKind;
  data: unknown;
}) => Promise<Proposal<WillProposalKind> | null>;

export type BuildNoteToolsOptions = {
  userId: string;
  defaultSource: NoteSourceLiteral;
  onProposal?: RaiseProposal;
};

/**
 * Build the agent tool set. Tools are bound to a specific user + source so
 * the model can never write to a different account or invent provenance.
 */
export function buildNoteTools(opts: BuildNoteToolsOptions) {
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
      description:
        "Ask the user to confirm deleting a note. This does NOT delete anything — it shows the user a Confirm/Keep card and the note is only removed once they tap Confirm. Tell the user you are asking them to confirm; never claim the note is gone.",
      inputSchema: z.object({
        id: z.string(),
      }),
      execute: async ({ id }) => {
        if (!opts.onProposal) {
          // No channel is able to collect a confirmation on this turn, so the
          // safe answer is to do nothing rather than fall back to deleting.
          return { proposed: false, reason: "confirmation_unavailable" };
        }
        const preview = await buildDeletePreview(opts.userId, id);
        if (preview === undefined) {
          return { proposed: false, reason: "not_found" };
        }
        const proposal = await opts.onProposal({
          kind: "deleteNote",
          data: { noteId: id, preview },
        });
        if (!proposal) {
          return { proposed: false, reason: "not_found" };
        }
        return { proposed: true, proposalId: proposal.id };
      },
    }),

    updateNote: tool({
      description:
        "Edit an existing note's body and/or tags. Use this when the user says things like 'change my note about X to ...', 'fix the typo in my last note', 'replace tags', or 'remove the tag X from my note'. Only ever pass an `id` you previously got from listRecentNotes / searchNotes / saveNote in this conversation. If `tags` is provided it REPLACES the full tag set (pass [] to strip every tag). Omit `body` or `tags` to leave them alone.",
      inputSchema: z.object({
        id: z.string(),
        body: z.string().min(1).max(8000).optional(),
        tags: z.array(z.string().min(1).max(32)).max(10).optional(),
      }),
      execute: async ({ id, body, tags }) => {
        if (body === undefined && tags === undefined) {
          return { updated: false, reason: "no_fields" };
        }
        const note = await updateNotePersist(opts.userId, id, {
          body,
          tagNames: tags,
        });
        if (!note) return { updated: false, reason: "not_found" };
        return {
          updated: true,
          id: note.id,
          body: note.body,
          tags: note.tags.map((t) => t.tag.name),
          updatedAt: note.updatedAt.toISOString(),
        };
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
