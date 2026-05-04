# web-journal

> The web app: a calm, English-only, day-grouped folio of notes. Today
> read-only — all writes happen in the chat.

## What it does

A signed-in user lands on `/app` and sees their notes grouped by day
("Today", "Yesterday", and dated headers below). Each note shows:

- The body (plain text).
- The source icon (Telegram text / voice / photo / PDF / web).
- Tags as chips.
- A bell + dueAt if the note has a pending reminder.

The user cannot create, edit, or delete from the web in v1 — every
mutation goes through the agent (Telegram chat). The web exists to
read back what was captured. The `WEB` value in the `NoteSource` enum
is reserved for a future web quick-add, but no UI feeds it today.

## Where the code lives

| Layer | Path |
|-------|------|
| Page | [`src/app/(authed)/app/page.tsx`](../../src/app/(authed)/app) |
| Layout | [`src/app/(authed)/layout.tsx`](../../src/app/(authed)) |
| API (read) | [`src/app/api/notes/route.ts`](../../src/app/api/notes/route.ts), [`src/app/api/notes/[id]/route.ts`](../../src/app/api/notes/%5Bid%5D/route.ts) |
| Day grouping | [`src/lib/notes/day-bucket.ts`](../../src/lib/notes/day-bucket.ts) |
| Components | [`src/components/`](../../src/components) |

## Data model

Reads `Note` (with `tags` and optional `reminder`) for the current
user. No new model.

## Contracts

### Inputs

- `GET /api/notes` — returns the authenticated user's recent notes
  (limit + cursor TBD; see route for actual schema).
- `GET /api/notes/[id]` — single note for a future detail / share view.

Both are wrapped in `withApi()` and require a valid session.

### Outputs

The page is a server component that fetches via the API (or via the
DB directly through a server action — confirm in the route file
before adding new behaviour). Tags and reminders are eagerly loaded
to avoid a waterfall.

## Invariants

- **Web is English-only.** Don't sprinkle Spanish / Portuguese /
  Arabic copy in TSX. Locale matters only for the agent and bot.
- **No client-side Prisma.** All DB access is server-side via the API
  routes or server components.
- **Tag chips are clickable filters.** Filtering happens client-side
  for the loaded set; server-side filtering uses `searchNotes(...,
  { tag })` from [`persistence.ts`](../../src/lib/notes/persistence.ts).
- **Read-only by design.** Adding a write here means:
  1. A new API route under `/api/notes/...` wrapped in `withApi()`.
  2. Setting `Note.source = "WEB"` for new notes from the web.
  3. Updating [`notes-and-tags`](notes-and-tags.md) and this spec.
  4. A CHANGELOG entry.

## Known gaps / TODOs

- No quick-add box yet. The `WEB` source enum is reserved for it.
- No infinite scroll / cursor-based pagination implemented; we load a
  fixed window today.
- No filtering by date range or source from the UI.
- No "share" view for a single note (the `[id]` route exists but no UI
  consumer yet).
- Charts / weekly summaries / heatmaps are not implemented.
- Mobile layout is functional but not polished.

## Related

- Spec: [`notes-and-tags`](notes-and-tags.md)
- Spec: [`note-agent`](note-agent.md) — the only mutation surface
  today.
- Spec: [`telegram-bot`](telegram-bot.md) — where users actually
  capture.
- Skill: [`engineer-data`](../../.cursor/skills/engineer-data/SKILL.md)
- Skill: [`ux-writer`](../../.cursor/skills/ux-writer/SKILL.md) —
  English-only voice for web copy.
