# agent-quota

> Per-user daily cap on agent messages (default 30/day, combined web +
> Telegram). One atomic counter per user per UTC day; checked before
> every agent run.

## What it does

Every time a user invokes the agent (today: every Telegram message;
tomorrow: also every web chat message), Will:

1. Increments the user's `AgentMessageUsage` row for the current UTC
   day by 1.
2. Compares the post-increment count against
   `User.dailyAgentMessageLimit` (default `30`).
3. If over the limit, the bot replies with the localised
   `bot.quotaExceeded(limit)` message and **does not** invoke the
   agent.
4. After a successful agent run, augments the row with input / output
   token counts (informational, surfaced to admins).

The counter resets at **00:00 UTC** because that's the boundary the
schema uses for `day @db.Date`. It's deliberately UTC, not local —
keeping it timezone-aware would add complexity for marginal benefit.

## Where the code lives

| Layer | Path |
|-------|------|
| Service | [`src/lib/agent-quota.ts`](../../src/lib/agent-quota.ts) (`consumeAgentQuota`, `recordAgentTokens`) |
| Prisma model | [`prisma/schema.prisma`](../../prisma/schema.prisma) — `AgentMessageUsage` |
| Per-user limit | [`prisma/schema.prisma`](../../prisma/schema.prisma) — `User.dailyAgentMessageLimit` (default `30`) |
| Bot consumer | [`src/app/api/webhooks/telegram/route.ts`](../../src/app/api/webhooks/telegram/route.ts) (step 5: quota check) |
| Localised message | [`src/lib/i18n/dictionaries/`](../../src/lib/i18n/dictionaries) — `bot.quotaExceeded(limit)` |
| Admin tooling | [`src/lib/admin/`](../../src/lib/admin), [`src/app/api/admin/users/`](../../src/app/api/admin/users) |

## Data model

`AgentMessageUsage`:

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String @id @default(cuid())` | |
| `userId` | `String` | `@@index([userId])` |
| `day` | `DateTime @db.Date` | UTC day boundary. `@@unique([userId, day])`. |
| `count` | `Int @default(0)` | Increment per agent invocation (success or failure post-quota-check). |
| `inputTokens` | `Int @default(0)` | Augmented after agent returns. |
| `outputTokens` | `Int @default(0)` | Augmented after agent returns. |
| `updatedAt` | `DateTime @updatedAt` | |

`User`:

| Field | Type | Notes |
|-------|------|-------|
| `dailyAgentMessageLimit` | `Int @default(30)` | Per-user cap. Admin can raise on a case-by-case basis (no UI yet — set in DB). |

## Contracts

### `consumeAgentQuota(userId, now?)` → `{ ok, count, limit }`

- Atomically upserts `AgentMessageUsage { (userId, day) }`,
  incrementing `count`.
- Reads back the new count.
- Returns `ok = count <= limit`.

### `recordAgentTokens(userId, { input?, output?, now? })`

- Upserts the same row, augmenting token counters.
- Called after `runNoteAgent` returns.
- Idempotency: token counters are additive; calling multiple times
  per turn double-counts. Today we call once per turn from the
  Telegram webhook (after the agent completes).

### Bot reply

When `consumeAgentQuota` returns `ok: false`:

- Reply: `dict(locale).bot.quotaExceeded(limit)` (localised, includes
  the numeric limit).
- Status code from the webhook: `200 { ok: true }` (Telegram is
  satisfied, the user got a reply).

## Invariants

- **Quota is checked BEFORE the agent runs.** Saves model cost on
  refusal and prevents the model from acknowledging a request it
  can't fulfil.
- **One row per `(userId, UTC day)`.** Enforced by `@@unique`.
- **`count` is incremented even when the agent fails after the check.**
  This is intentional — a thrown agent error already cost us tokens.
  If we ever want to refund quota on failure, do it in the webhook
  catch block and document the change here.
- **Counter resets at midnight UTC.** A user who hits the cap at
  23:59 UTC gets one fresh message at 00:00 UTC.
- **Admin override is via DB `dailyAgentMessageLimit`.** No
  rate-card / Pro tier in v1.
- **Web + Telegram share one bucket.** When a web chat surface
  ships, it must call `consumeAgentQuota` from the same boundary.

## Known gaps / TODOs

- No per-user-timezone reset. Some users would prefer a
  local-midnight reset; UTC is simpler and matches our DB.
- No "you're at 25/30" early-warning message. Future: when count
  crosses 80% of the limit, surface a soft hint in the bot reply.
- No Pro tier in v1. If we add one, it would bump
  `dailyAgentMessageLimit` per subscription state.
- Token counts are informational only — not used for billing or
  per-user cost analysis. When we need that, build a daily admin
  rollup page.
- We don't currently rate-limit agent invocations from the future
  web chat surface in addition to the per-user quota. The Upstash
  rate limit is per-Telegram-id, not per-app-user.

## Related

- Spec: [`note-agent`](note-agent.md) — `runNoteAgent` is what's
  gated.
- Spec: [`telegram-bot`](telegram-bot.md) — the consumer in v1.
- Skill: [`engineer-data`](../../.cursor/skills/engineer-data/SKILL.md)
- Skill: [`automated-user-comms`](../../.cursor/skills/automated-user-comms/SKILL.md)
