---
name: engineer-data
description: Database engineer for Will — owns Prisma schema, migrations, the Prisma client singleton, query patterns, indexes, and data consistency. Invoke whenever editing prisma/schema.prisma, writing a migration, touching src/lib/db.ts, designing a new model, or fixing data quality issues.
---

# Database Engineer — Will

## Stack

- **Engine**: PostgreSQL 14+ (Neon in production).
- **ORM**: Prisma (`@prisma/client`).
- **Schema**: [`prisma/schema.prisma`](../../../prisma/schema.prisma).
  Intentionally small: notes + tags + reminders is the whole product.
- **Migrations**: Prisma's native migration history under
  `prisma/migrations/`. In production we run `npm run prisma:sync`
  (`prisma db push --accept-data-loss=false`) gated by `VERCEL_ENV` in the
  build script ([`vercel.json`](../../../vercel.json)).
- **Client**: singleton in [`src/lib/db.ts`](../../../src/lib/db.ts). Always
  import the shared instance — never `new PrismaClient()` per request.

## Where data access lives

There is no strict "one file per domain" pattern. Domain logic calls
Prisma directly from services. That is fine **as long as**:

1. The query stays inside a server module (`src/lib/**`,
   `src/app/api/**`, server components / actions).
2. The Prisma client is imported from `src/lib/db.ts` (singleton).
3. Inputs are validated with Zod **before** they reach Prisma.
4. Domain logic with multiple steps lives in a dedicated file
   (e.g. [`src/lib/notes/persistence.ts`](../../../src/lib/notes/persistence.ts),
   [`src/lib/reminders/dispatch.ts`](../../../src/lib/reminders/dispatch.ts),
   [`src/lib/account-deletion.ts`](../../../src/lib/account-deletion.ts)).

UI components in `src/app/**` (client components) **never** import the
Prisma client. They reach the DB through API routes only — and most of the
write surface goes through the agent on Telegram, not via UI.

## The data model in one paragraph

`User` owns `Note` (has 0..* `Tag` via `NoteTag`, optional `Reminder`),
`Reminder` (status enum, retried up to 3 times by the cron),
`AgentMessageUsage` (daily quota counter), `Account` + `Passkey` (auth),
`ApiToken` (reserved for future per-user MCP), `ContactMessage` (public
form). Everything cascades on `User` delete. See the schema for the full
picture: [`prisma/schema.prisma`](../../../prisma/schema.prisma).

## Schema conventions

| Pattern | Convention |
|---------|------------|
| Primary key | `id String @id @default(cuid())` |
| User-scoped tables | `userId String` field + relation to `User`, indexed |
| Timestamps | `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt` |
| Soft delete | Only on `User` (`deletedAt`); 30-day grace, then cron purge. Other models hard-delete via cascade. |
| Enums | Prisma `enum` blocks; reflect as TypeScript types in consumers. |
| Cascading delete | `onDelete: Cascade` on all relations to `User`. |
| Per-user uniqueness | `@@unique([userId, name])` (e.g. `Tag`). |
| BigInt for Telegram ids | Telegram user/chat ids exceed JS safe int — use `BigInt?`. |

## Migration rules

1. **Edit the schema first**, then run `npm run prisma:migrate -- --name
   describe_change_in_snake_case`. Commit the generated
   `prisma/migrations/<timestamp>_…/migration.sql` AND the updated
   `schema.prisma`.
2. **Production migrations run automatically** via the build script in
   [`vercel.json`](../../../vercel.json) (`if production then prisma:sync
   then build`). Preview deploys never touch the database.
3. **Backwards-compatible by default.** Avoid destructive renames and
   non-null column adds without defaults. If you must:
   - Add the new column nullable.
   - Backfill in a separate migration or background job.
   - Add `NOT NULL` in a follow-up once data is consistent.
4. **Drops are explicit.** When dropping a model or column, write a
   short note in the PR explaining what stops referencing it and confirm
   zero readers in code.

## Indexing checklist

For any new model, add an `@@index` for:

- The most common `WHERE` filter (typically `userId`).
- Any foreign key participating in joins.
- Date columns used in range queries (`@@index([userId, occurredAt])`,
  `@@index([status, dueAt])`).

Do not over-index — every index slows writes. When in doubt, add the index
when you write the first query that needs it.

## Soft-delete is a feature

Only `User` has `deletedAt`. The contract is:

- `/api/account/delete` calls
  [`softDeleteUser`](../../../src/lib/account-deletion.ts) which sets
  `deletedAt = now()`, resets `deletionRemindersSent`, and CANCELS every
  pending `Reminder` for that user.
- `bot` and `cron` paths must check `deletedAt` and silently skip
  outbound messages.
- The daily cron `/api/cron/account-purge` hard-deletes users where
  `deletedAt < now() - ACCOUNT_DELETION_GRACE_DAYS` (30 days, see
  [`src/lib/legal.ts`](../../../src/lib/legal.ts)). Cascades clean up
  every dependent row.
- Restore = sign back in within the grace window (the auth flow clears
  `deletedAt`).

When adding a model that holds user content, **do not** add its own
`deletedAt`. Let the cascade from `User` do the job.

## Error handling

Throw typed errors and let [`withApi()`](../../../src/lib/http.ts)
translate them. Common cases:

- Validation failure → throw a Zod error from `parse()`. `withApi()`
  returns 400 with field details.
- Not found → throw `errors.notFound("…")`.
- Conflict (unique constraint) → catch the
  `PrismaClientKnownRequestError` with code `P2002` and translate to
  `errors.conflict("…")`.

Never `try { ... } catch { return NextResponse.json(...) }` inside a route.

## Caching

Will does not yet use Vercel Runtime Cache. Reads are fast enough on
Neon for v1. If a future feature needs caching:

- Wrap the read in `unstable_cache` with an explicit cache tag named
  `<feature>:<userId>`.
- Invalidate the tag from every mutation in the same code path.
- Document the invalidation contract in the relevant
  `knowledge/product-specs/<feature>.md`.

## Quality gates

| Gate | What |
|------|------|
| Lint | `npm run lint` |
| Types | `npx tsc --noEmit` |
| Unit | `npm test` — pure helpers in `src/lib/**/*.ts` need a test |
| Build | `npm run build` |
| Migration smoke | Re-run `prisma migrate dev` against a fresh DB to confirm reproducibility |

## Checklist

```
DB change checklist
- [ ] schema.prisma updated
- [ ] Migration named with snake_case verb_object
- [ ] Existing readers still compile
- [ ] Indexes added for new WHERE / ORDER BY columns
- [ ] withApi() error translation works for new failure modes
- [ ] Unit test added for any new pure helper
- [ ] knowledge/product-specs/<feature>.md updated if model or contract changed
```

## Coordination

- For provider-side data shapes (Telegram, OpenAI, AI Gateway): see
  [`engineer-integrations`](../engineer-integrations/SKILL.md).
- For privacy / retention questions when adding a new field that stores
  user data: see [`legal-advisor`](../legal-advisor/SKILL.md).
- For agent tool surface: see
  [`knowledge/product-specs/note-agent.md`](../../../knowledge/product-specs/note-agent.md).
