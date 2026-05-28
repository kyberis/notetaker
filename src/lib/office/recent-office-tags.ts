import { db } from "@/lib/db";

export interface OfficeTagInsight {
  label: string;
  date: string;
}

export interface OfficeRecentTagsResult {
  tags: OfficeTagInsight[];
  excerpt?: string;
  noteDate?: string;
}

const TAG_LIMIT = 8;
const EXCERPT_MAX = 160;

function formatExcerpt(body: string): string {
  const trimmed = body.replace(/\s+/g, " ").trim();
  if (trimmed.length <= EXCERPT_MAX) return trimmed;
  return `${trimmed.slice(0, EXCERPT_MAX - 1).trimEnd()}…`;
}

/**
 * Recent tags from the user's latest notes (for trefolio AID insight card).
 */
export async function listRecentOfficeTags(userId: string): Promise<OfficeRecentTagsResult> {
  const rows = await db.noteTag.findMany({
    where: { note: { userId } },
    orderBy: { note: { occurredAt: "desc" } },
    take: 40,
    select: {
      tag: { select: { name: true } },
      note: { select: { body: true, occurredAt: true } },
    },
  });

  const seen = new Set<string>();
  const tags: OfficeTagInsight[] = [];

  for (const row of rows) {
    const label = row.tag.name;
    if (seen.has(label)) continue;
    seen.add(label);
    tags.push({
      label,
      date: row.note.occurredAt.toISOString().slice(0, 10),
    });
    if (tags.length >= TAG_LIMIT) break;
  }

  const latestNote = rows[0]?.note;
  return {
    tags,
    excerpt: latestNote ? formatExcerpt(latestNote.body) : undefined,
    noteDate: latestNote ? latestNote.occurredAt.toISOString().slice(0, 10) : undefined,
  };
}
