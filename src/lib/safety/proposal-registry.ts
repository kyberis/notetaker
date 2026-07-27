import { ProposalRegistry } from "@kyberis/agent-os/safety";
import { z } from "zod";

import { dict, type Locale } from "@/lib/i18n";
import { deleteNote, getNoteById } from "@/lib/notes/persistence";

/**
 * Writes Will will not perform without an explicit tap from the user.
 *
 * Deleting used to run straight from the tool call behind a `confirm: true`
 * argument, which the model sets on its own — so it was never a confirmation.
 * Now the tool only describes the deletion; the row survives until the user
 * presses the button.
 */

export type WillProposalKind = "deleteNote";

const deleteNoteSchema = z.object({
  noteId: z.string().min(1),
  /** Snapshot of the body so the card can show what is about to disappear. */
  preview: z.string().max(160).optional(),
});

export type DeleteNoteProposalData = z.infer<typeof deleteNoteSchema>;

/**
 * Labels are locale-specific, so the registry is built per turn. It holds no
 * state beyond its handlers, which makes this cheap.
 */
export function buildProposalRegistry(locale: Locale): ProposalRegistry<WillProposalKind> {
  const D = dict(locale);

  return new ProposalRegistry<WillProposalKind>().register<DeleteNoteProposalData>(
    "deleteNote",
    {
      destructive: true,
      parse: (raw) => deleteNoteSchema.safeParse(raw).data ?? null,
      describe: (data) => ({
        title: D.bot.confirmDeleteTitle,
        summary: D.bot.confirmDeleteSummary,
        rows: data.preview
          ? [{ label: D.bot.confirmNoteLabel, value: data.preview }]
          : [],
      }),
      execute: async (userId, data) => {
        const ok = await deleteNote(userId, data.noteId);
        if (!ok) return { ok: false, status: 404, error: D.bot.confirmFailed };
        return { ok: true, entityId: data.noteId, message: D.bot.deleted };
      },
    },
  );
}

/** Short preview of a note body for the confirmation card. */
export async function buildDeletePreview(
  userId: string,
  noteId: string,
): Promise<string | undefined> {
  const note = await getNoteById(userId, noteId);
  if (!note) return undefined;
  const flat = note.body.replace(/\s+/g, " ").trim();
  return flat.length > 160 ? `${flat.slice(0, 157)}…` : flat;
}
