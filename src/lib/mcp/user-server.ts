import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { db } from "@/lib/db";
import { listRecentNotes, searchNotes } from "@/lib/notes/persistence";

function jsonContent(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function errContent(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true as const,
  };
}

function getUserIdFromExtra(extra: { authInfo?: { extra?: Record<string, unknown> } }) {
  const userId = extra.authInfo?.extra?.userId;
  return typeof userId === "string" && userId.length > 0 ? userId : null;
}

function serializeNote(n: {
  id: string;
  body: string;
  occurredAt: Date;
  tags: { tag: { name: string } }[];
  reminder: { id: string; dueAt: Date; status: string } | null;
}) {
  return {
    id: n.id,
    body: n.body,
    occurredAt: n.occurredAt.toISOString(),
    tags: n.tags.map((t) => t.tag.name),
    reminder: n.reminder
      ? { id: n.reminder.id, dueAt: n.reminder.dueAt.toISOString(), status: n.reminder.status }
      : null,
  };
}

/** Authenticated MCP tools for Will (notes + reminders read). */
export function registerWillUserMcp(server: McpServer): void {
  server.registerTool(
    "getProfile",
    {
      title: "User profile",
      description: "Email and locale for the signed-in Will user.",
      inputSchema: {},
    },
    async (_args, extra) => {
      const userId = getUserIdFromExtra(extra);
      if (!userId) return errContent("Unauthorized.");
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, locale: true, createdAt: true },
      });
      if (!user) return errContent("User not found.");
      return jsonContent({
        email: user.email,
        name: user.name,
        locale: user.locale,
        createdAt: user.createdAt.toISOString(),
      });
    },
  );

  server.registerTool(
    "listRecentNotes",
    {
      title: "List recent notes",
      description: "Returns the most recent notes (newest first).",
      inputSchema: {
        limit: z.number().int().min(1).max(50).optional(),
      },
    },
    async ({ limit }, extra) => {
      const userId = getUserIdFromExtra(extra);
      if (!userId) return errContent("Unauthorized.");
      const rows = await listRecentNotes(userId, limit ?? 15);
      return jsonContent(rows.map(serializeNote));
    },
  );

  server.registerTool(
    "searchNotes",
    {
      title: "Search notes",
      description: "Search note bodies (case-insensitive) and optionally filter by tag.",
      inputSchema: {
        query: z.string().optional(),
        tag: z.string().optional(),
        limit: z.number().int().min(1).max(50).optional(),
      },
    },
    async ({ query, tag, limit }, extra) => {
      const userId = getUserIdFromExtra(extra);
      if (!userId) return errContent("Unauthorized.");
      if (!query && !tag) {
        return errContent("Provide at least `query` or `tag`.");
      }
      const rows = await searchNotes(userId, { query, tag, limit });
      return jsonContent(rows.map(serializeNote));
    },
  );

  server.registerTool(
    "getNote",
    {
      title: "Get note by id",
      description: "Fetch a single note if it belongs to the user.",
      inputSchema: {
        noteId: z.string().min(1),
      },
    },
    async ({ noteId }, extra) => {
      const userId = getUserIdFromExtra(extra);
      if (!userId) return errContent("Unauthorized.");
      const note = await db.note.findFirst({
        where: { id: noteId, userId },
        include: {
          tags: { include: { tag: true } },
          reminder: true,
        },
      });
      if (!note) return errContent("Note not found.");
      return jsonContent(serializeNote(note));
    },
  );
}
