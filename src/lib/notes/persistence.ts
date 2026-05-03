import { Prisma, type NoteSource } from "@prisma/client";

import { db } from "@/lib/db";

import { normalizeTagName, REMINDER_TAG_NAME } from "./tags";

export type CreateNoteInput = {
  userId: string;
  body: string;
  source: NoteSource;
  occurredAt?: Date;
  sourceMeta?: Prisma.InputJsonValue;
  tagNames?: string[];
};

/**
 * Create a note + (optionally) attach tags by name. Idempotent on tag
 * upsert: same tag name reused across notes resolves to one row.
 */
export async function createNote(input: CreateNoteInput) {
  const occurredAt = input.occurredAt ?? new Date();
  const tagNames = (input.tagNames ?? [])
    .map(normalizeTagName)
    .filter(Boolean);
  const uniqueTags = Array.from(new Set(tagNames));

  return await db.$transaction(async (tx) => {
    const note = await tx.note.create({
      data: {
        userId: input.userId,
        body: input.body,
        source: input.source,
        occurredAt,
        sourceMeta: input.sourceMeta ?? Prisma.JsonNull,
      },
    });

    if (uniqueTags.length === 0) return note;

    for (const name of uniqueTags) {
      const tag = await tx.tag.upsert({
        where: { userId_name: { userId: input.userId, name } },
        create: {
          userId: input.userId,
          name,
          isReminderTag: name === REMINDER_TAG_NAME,
        },
        update: {},
      });
      await tx.noteTag.upsert({
        where: { noteId_tagId: { noteId: note.id, tagId: tag.id } },
        create: { noteId: note.id, tagId: tag.id },
        update: {},
      });
    }

    return note;
  });
}

export async function attachTagsToNote(noteId: string, userId: string, tagNames: string[]) {
  const cleaned = Array.from(new Set(tagNames.map(normalizeTagName).filter(Boolean)));
  if (cleaned.length === 0) return [];

  return await db.$transaction(async (tx) => {
    const result: { id: string; name: string }[] = [];
    for (const name of cleaned) {
      const tag = await tx.tag.upsert({
        where: { userId_name: { userId, name } },
        create: {
          userId,
          name,
          isReminderTag: name === REMINDER_TAG_NAME,
        },
        update: {},
      });
      await tx.noteTag.upsert({
        where: { noteId_tagId: { noteId, tagId: tag.id } },
        create: { noteId, tagId: tag.id },
        update: {},
      });
      result.push({ id: tag.id, name: tag.name });
    }
    return result;
  });
}

export async function listRecentNotes(userId: string, limit = 10) {
  return await db.note.findMany({
    where: { userId },
    orderBy: { occurredAt: "desc" },
    take: limit,
    include: {
      tags: { include: { tag: true } },
      reminder: true,
    },
  });
}

export async function searchNotes(userId: string, opts: { query?: string; tag?: string; limit?: number }) {
  const limit = Math.min(opts.limit ?? 10, 50);
  return await db.note.findMany({
    where: {
      userId,
      ...(opts.query
        ? { body: { contains: opts.query, mode: "insensitive" as const } }
        : {}),
      ...(opts.tag
        ? {
            tags: {
              some: { tag: { name: normalizeTagName(opts.tag) } },
            },
          }
        : {}),
    },
    orderBy: { occurredAt: "desc" },
    take: limit,
    include: {
      tags: { include: { tag: true } },
      reminder: true,
    },
  });
}

export async function deleteNote(userId: string, noteId: string) {
  const result = await db.note.deleteMany({ where: { id: noteId, userId } });
  return result.count > 0;
}
