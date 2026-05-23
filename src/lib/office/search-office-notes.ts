import { db } from "@/lib/db";

export interface OfficeNoteHit {
  excerpt: string;
  noteDate: string;
}

const OFFICE_SEARCH_LIMIT = 200;
const EXCERPT_MAX = 160;

export function formatOfficeNoteExcerpt(body: string, max = EXCERPT_MAX): string {
  const trimmed = body.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function queryTokens(query: string): string[] {
  return Array.from(
    new Set(
      query
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 3),
    ),
  );
}

/**
 * Search recent notes for Agent Office coordination. Uses token OR matching
 * when the query contains multiple words (Warren sends broad topic strings).
 */
export async function searchOfficeNotes(userId: string, query: string): Promise<OfficeNoteHit | null> {
  const tokens = queryTokens(query);
  const notes = await db.note.findMany({
    where: {
      userId,
      ...(tokens.length > 0
        ? {
            OR: tokens.map((token) => ({
              body: { contains: token, mode: "insensitive" as const },
            })),
          }
        : query.trim()
          ? { body: { contains: query.trim(), mode: "insensitive" as const } }
          : {}),
    },
    orderBy: { occurredAt: "desc" },
    take: OFFICE_SEARCH_LIMIT,
    select: { body: true, occurredAt: true },
  });

  const hit = notes[0];
  if (!hit) return null;

  return {
    excerpt: formatOfficeNoteExcerpt(hit.body),
    noteDate: hit.occurredAt.toISOString().slice(0, 10),
  };
}
