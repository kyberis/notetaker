# <feature-name>

> One-line summary of what this feature does for the user.

## What it does

User-visible behaviour. What changes for the user when this feature is in
play. Keep it concrete and benefit-oriented (not engineering jargon).

## Where the code lives

| Layer | Path |
|-------|------|
| Types / validators | `src/lib/...` |
| DB / Prisma model | `prisma/schema.prisma` (model `...`) |
| Service | `src/lib/...` |
| Agent tool(s) | `src/lib/ai/note-tools.ts` (tool name) |
| Telegram path | `src/app/api/webhooks/telegram/route.ts` (section) |
| Cron / job | `src/app/api/cron/.../route.ts` |
| API routes | `src/app/api/...` |
| UI | `src/app/(authed)/...`, `src/components/...` |
| Marketing copy | `src/lib/marketing-content.ts` |

## Data model

Prisma models touched, key fields, relationships. Note any uniqueness
constraints, soft deletes, or per-user scoping.

## Contracts

- API endpoints (method + path + Zod schema reference + key error codes from
  `withApi()`).
- Agent tools exposed (name + input schema + side effects).
- Telegram inputs / outputs (text / voice / photo / PDF; reply shapes).
- Webhooks consumed.

## Invariants

Things that must always be true. Examples:
- A `Reminder` is unique per `Note` (1:1).
- Tags are per-user namespaced (`@@unique([userId, name])`).
- Soft-deleted users (`User.deletedAt != null`) receive zero outbound
  Telegram or email messages.
- Daily agent quota counts both web chat and Telegram in one bucket.

## Known gaps / TODOs

What we know is broken, missing, or hand-wavy. Be honest — the next agent
will read this.

## Related

- Design doc: `knowledge/design-docs/...`
- Skill: `.cursor/skills/.../SKILL.md`
- Rule: `.cursor/rules/...`
