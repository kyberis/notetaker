import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { NoteSource } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";
import { gateWillMcpTool, jsonContent, errContent } from "@/lib/mcp/mcp-helpers";
import { createNote, listRecentNotes, searchNotes } from "@/lib/notes/persistence";

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

/** Authenticated MCP tools for Will (notes read + optional write). */
export function registerWillUserMcp(server: McpServer): void {
  server.registerTool(
    "getProfile",
    {
      title: "User profile",
      description: "Email and locale for the signed-in Will user.",
      inputSchema: {},
    },
    async (_args, extra) => {
      const gate = gateWillMcpTool(extra, "getProfile");
      if (!gate.ok) return gate.response;
      const user = await db.user.findUnique({
        where: { id: gate.userId },
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
      const gate = gateWillMcpTool(extra, "listRecentNotes");
      if (!gate.ok) return gate.response;
      const rows = await listRecentNotes(gate.userId, limit ?? 15);
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
      const gate = gateWillMcpTool(extra, "searchNotes");
      if (!gate.ok) return gate.response;
      if (!query && !tag) {
        return errContent("Provide at least `query` or `tag`.");
      }
      const rows = await searchNotes(gate.userId, { query, tag, limit });
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
      const gate = gateWillMcpTool(extra, "getNote");
      if (!gate.ok) return gate.response;
      const note = await db.note.findFirst({
        where: { id: noteId, userId: gate.userId },
        include: {
          tags: { include: { tag: true } },
          reminder: true,
        },
      });
      if (!note) return errContent("Note not found.");
      return jsonContent(serializeNote(note));
    },
  );

  server.registerTool(
    "createNote",
    {
      title: "Create note",
      description:
        "Append a note to the user's Will journal. Requires notes:write scope. Body is stored as provided; tag names are optional.",
      inputSchema: {
        body: z.string().min(1).max(20_000),
        tagNames: z.array(z.string().min(1).max(64)).max(10).optional(),
        occurredAt: z.string().datetime().optional(),
      },
    },
    async ({ body, tagNames, occurredAt }, extra) => {
      const gate = gateWillMcpTool(extra, "createNote");
      if (!gate.ok) return gate.response;

      const note = await createNote({
        userId: gate.userId,
        body: body.trim(),
        source: NoteSource.WEB,
        occurredAt: occurredAt ? new Date(occurredAt) : undefined,
        tagNames,
        sourceMeta: { via: "mcp", tool: "createNote" },
      });

      const full = await db.note.findFirst({
        where: { id: note.id, userId: gate.userId },
        include: {
          tags: { include: { tag: true } },
          reminder: true,
        },
      });
      if (!full) return jsonContent({ id: note.id, body: note.body });
      return jsonContent(serializeNote(full));
    },
  );
}
