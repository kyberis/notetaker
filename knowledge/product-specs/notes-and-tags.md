# notes-and-tags

> The core data primitive. Everything else (reminders, journal, search,
> agent tools) reads or writes through this.

## What it does

A `Note` captures a thought the user put into Will: a paragraph of text,
a transcribed voice memo, an extracted PDF page, a vision-described
photo. Notes carry a `body`, an `occurredAt` timestamp, a `source`
channel (where it came in), and 0..N tags. Tags are user-scoped
(`#idea` for one user is a different `#idea` for another).

## Where the code lives

| Layer | Path |
|-------|------|
| Prisma models | [`prisma/schema.prisma`](../../prisma/schema.prisma) — `Note`, `Tag`, `NoteTag`, enum `NoteSource` |
| Persistence | [`src/lib/notes/persistence.ts`](../../src/lib/notes/persistence.ts) (`createNote`, `attachTagsToNote`, `listRecentNotes`, `searchNotes`, `updateNote`, `deleteNote`) |
| Tag normalization | [`src/lib/notes/tags.ts`](../../src/lib/notes/tags.ts) (`normalizeTagName`) |
| Day grouping (web journal) | [`src/lib/notes/day-bucket.ts`](../../src/lib/notes/day-bucket.ts) |
| Agent tools | [`src/lib/ai/note-tools.ts`](../../src/lib/ai/note-tools.ts) (`saveNote`, `proposeTags`, `updateNote`, `deleteNote`, `searchNotes`, `listRecentNotes`) |
| Read API for the web journal | [`src/app/api/notes/`](../../src/app/api/notes) (route + `[id]/`) |

## Data model

```
User --< Note >-- NoteTag >-- Tag
                 \
                  -- Reminder (1:1, optional)
```

`Note`:

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String @id @default(cuid())` | |
| `userId` | `String` | `@@index([userId, occurredAt])`, `@@index([userId, createdAt])` |
| `body` | `String @db.Text` | Plain text. Markdown is allowed but rendered plain in the journal. |
| `source` | `NoteSource` enum | `TELEGRAM_TEXT | TELEGRAM_VOICE | TELEGRAM_PHOTO | TELEGRAM_PDF | WEB` |
| `occurredAt` | `DateTime` | "Logical" date. Defaults to `createdAt`; agent may set to "yesterday" if user explicitly says so. Used for journal grouping and `since` filters. |
| `sourceMeta` | `Json?` | Free-form provenance (Telegram message id, voice duration, photo file_id). Never displayed; useful for debugging. |
| `createdAt`, `updatedAt` | `DateTime` | |

`Tag`:

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String @id @default(cuid())` | |
| `userId` | `String` | `@@unique([userId, name])`, `@@index([userId])` |
| `name` | `String` | Lowercase, no leading `#`, no spaces. Enforced in `normalizeTagName`. |
| `isReminderTag` | `Boolean @default(false)` | When user adds this tag, offer to set a reminder. The seeded `"reminder"` tag has this flag. |
| `createdAt` | `DateTime` | |

`NoteTag` is a join table (`@@id([noteId, tagId])`).

## Contracts

### Persistence helpers

- `createNote({ userId, body, source, occurredAt? })` → returns the
  full `Note` (with `id`, `occurredAt`).
- `attachTagsToNote(noteId, userId, tagNames[])` → upserts `Tag` rows
  by `(userId, name)`, creates missing `NoteTag`. Returns the applied
  tags.
- `updateNote(userId, noteId, { body?, tagNames? })` → mutates body
  and/or replaces the entire tag set (pass `tagNames: []` to strip
  every tag). Returns the updated note with `tags`. Returns `null`
  when the note doesn't exist for that user.
- `deleteNote(userId, id)` → cascades remove `NoteTag` and
  `Reminder`. Returns boolean ok.
- `listRecentNotes(userId, limit)` → ordered by `occurredAt desc`,
  with `tags` and optional `reminder.dueAt`.
- `searchNotes(userId, { query?, tag?, limit? })` → SQL `ILIKE` on
  `body` plus optional tag filter via the join.

### API surface

- `GET /api/notes` — read-only list of the authenticated user's
  recent notes (web journal feeds off this).
- `GET /api/notes/[id]` — single note for detail / share view.

Mutations happen via the agent (Telegram or future web chat), not via
REST API in v1.

### Agent tool surface

See [`note-agent`](note-agent.md). Tools that touch this data:
`saveNote`, `proposeTags`, `updateNote`, `deleteNote`, `searchNotes`,
`listRecentNotes`.

## Invariants

- **Tag namespace is per-user.** `@@unique([userId, name])` enforces
  it. Two users can both have `#idea`; they are different rows.
- **Tag names are normalised.** `normalizeTagName` strips `#`,
  lowercases, removes whitespace. Apply at every entry point —
  agent tool, future web quick-add, future REST.
- **Cascade on user delete.** Deleting a `User` cascades through
  `Note`, `NoteTag`, `Tag`, `Reminder` — no orphans, no manual cleanup.
- **`Reminder` is 1:1 with `Note`.** `Reminder.noteId` is `@unique`.
  A user can attach at most one reminder per note (cancel + create new
  to "reschedule").
- **`source` is set at creation.** Don't mutate `source` later — it's
  provenance, used for analytics and per-source UI affordances.
- **Notes are not soft-deleted.** Hard delete via the agent or web
  delete. Account soft-delete pauses outbound but keeps notes intact
  during the grace window; the purge cron then cascades.

## Known gaps / TODOs

- No web-side note creation in v1 — see [`web-journal`](web-journal.md)
  for the "WEB" enum value being reserved.
- Search is `ILIKE` only (no Postgres FTS, no embeddings). Works fine
  at small scale; revisit when a user has 10k+ notes.
- We don't have a "favorites" or "pinned" concept yet. Adding one
  would be a column on `Note` and a tool for the agent.
- `sourceMeta` is free-form `Json?` — handy but un-typed. If we ever
  need to query it (e.g. "find all notes from a specific Telegram
  message id") add typed columns.
- No tag aliases (`#idea` vs `#ideas`). Encourage canonical naming via
  the agent's prompt.

## Related

- Spec: [`note-agent`](note-agent.md)
- Spec: [`telegram-bot`](telegram-bot.md)
- Spec: [`reminders`](reminders.md)
- Spec: [`web-journal`](web-journal.md)
- Skill: [`engineer-data`](../../.cursor/skills/engineer-data/SKILL.md)
