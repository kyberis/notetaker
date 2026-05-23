import { NoteSource } from "@prisma/client";

import { createNote } from "@/lib/notes/persistence";

const OFFICE_TAGS = ["office", "investing"] as const;

export async function createOfficeNote(userId: string, text: string) {
  const body = text.trim();
  if (!body) {
    return { ok: false as const, error: "empty_text" };
  }

  const note = await createNote({
    userId,
    body,
    source: NoteSource.WEB,
    tagNames: [...OFFICE_TAGS],
  });

  return {
    ok: true as const,
    noteId: note.id,
    message: "Note logged",
  };
}
