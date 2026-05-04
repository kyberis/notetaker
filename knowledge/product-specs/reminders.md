# reminders

> Time-anchored bells. The agent schedules them when a note has a
> date / time intent; a 1-minute cron dispatches them via Telegram
> with email fallback after retries.

## What it does

When the user writes "buy flowers tomorrow at 9am", the agent saves
the note, then offers a reminder. On confirmation it stores a
`Reminder { dueAt, naturalText }`. Every minute the cron picks
PENDING reminders whose `dueAt <= now()` and sends them via Telegram.

If a reminder fails to send (Telegram down, user has no chat id), the
cron retries up to 3 times. After the third failure it falls back to
sending the reminder by email (via Resend) and marks the row FAILED.

## Where the code lives

| Layer | Path |
|-------|------|
| Prisma model | [`prisma/schema.prisma`](../../prisma/schema.prisma) — `Reminder`, enum `ReminderStatus` |
| Schedule | [`src/lib/reminders/schedule.ts`](../../src/lib/reminders/schedule.ts) (`scheduleReminder`) |
| Dispatch | [`src/lib/reminders/dispatch.ts`](../../src/lib/reminders/dispatch.ts) (`dispatchDueReminders`) |
| Cron route | [`src/app/api/cron/reminders/route.ts`](../../src/app/api/cron/reminders/route.ts) |
| Cron auth | [`src/lib/auth/cron.ts`](../../src/lib/auth/cron.ts) (`verifyCronRequest`) |
| Vercel cron registration | [`vercel.json`](../../vercel.json) |
| Agent tool | [`src/lib/ai/note-tools.ts`](../../src/lib/ai/note-tools.ts) — `setReminder` |
| Localised "reminder fired" string | [`src/lib/i18n/dictionaries/`](../../src/lib/i18n/dictionaries) — `bot.reminderFired(noteBody)` |
| Email fallback | [`src/lib/mail/resend.ts`](../../src/lib/mail/resend.ts) (`sendMail`) |

## Data model

`Reminder`:

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String @id @default(cuid())` | |
| `userId` | `String` | `@@index([userId])` |
| `noteId` | `String @unique` | 1:1 with `Note` |
| `dueAt` | `DateTime` | UTC. Cron compares with `now()`. |
| `naturalText` | `String?` | Human echo of the user's phrase ("tomorrow at 9am"), surfaced in the bot's "I'll remind you on Friday at 9:00" reply. |
| `status` | `ReminderStatus` (`PENDING | SENT | CANCELLED | FAILED`) | `@@index([status, dueAt])` |
| `attempts` | `Int @default(0)` | |
| `sentAt`, `failedAt`, `cancelledAt` | `DateTime?` | |

## Contracts

### Schedule (agent tool)

`setReminder({ noteId, dueAt: ISO8601, naturalText? })`:

- Creates a `Reminder { status: PENDING }`.
- Refuses past `dueAt` (the Zod schema requires a future timestamp; the
  agent prompt also reinforces this).
- Bound to the `userId` from the agent loop's closure — the model can't
  schedule on someone else's note.

### Dispatch (cron)

`GET /api/cron/reminders`:

- **Auth**: `verifyCronRequest(req)` checks the `CRON_SECRET` header
  Vercel injects.
- **Schedule**: `* * * * *` (every minute) in
  [`vercel.json`](../../vercel.json).
- **Function timeout**: `maxDuration = 60` seconds.

`dispatchDueReminders(now?)` returns `{ attempted, sent, retried,
failed }`. Per-row behaviour:

1. Pull up to **50** PENDING rows where `dueAt <= now`, oldest first.
2. For each:
   - **Soft-deleted user** → set `status: CANCELLED, cancelledAt: now`.
     Skip outbound.
   - **Send via Telegram** (if `telegramChatId` exists).
   - **Success** → `status: SENT, sentAt, attempts++`.
   - **Failure**:
     - `attempts + 1 >= 3` → `status: FAILED, failedAt, attempts =
       nextAttempts`. Then attempt **email fallback** via Resend
       (best-effort; email errors logged but not raised).
     - Otherwise → leave `PENDING`, bump `attempts`. Next minute will
       retry.

## Invariants

- **At most one reminder per note** (`Reminder.noteId @unique`). To
  reschedule: cancel + create new.
- **Soft-deleted users get nothing.** Cron CANCELs in flight.
- **No double-send across cron races.** Even though we don't use
  `SELECT ... FOR UPDATE`, the per-row `attempts++` makes a re-claim
  visible in the next round; combined with the 1-minute cadence and
  small batch size, races are observable but not user-visible.
- **Email fallback is best-effort.** A bouncing email doesn't fail the
  cron run.
- **`naturalText` is for echo only.** The cron uses `Note.body` for
  the actual reminder text.
- **All reminder text is HTML-escaped** before sending (note bodies
  may contain `<` etc.).

## Known gaps / TODOs

- No "snooze" tool yet. The agent could expose a `snoozeReminder` tool
  that bumps `dueAt` by a duration; not implemented in v1.
- No timezone-aware scheduling on the user side. The agent is told
  `nowUtc` and asks the user to clarify ambiguous times. A user
  preference for `User.timezone` would let the agent infer "9am" in
  the user's local time without asking.
- We don't surface FAILED reminders anywhere. A weekly "things we
  couldn't deliver" digest email would close the loop.
- Atomic claim is not literally `SELECT ... FOR UPDATE`. With higher
  concurrency we'd want a per-row lock.

## Related

- Spec: [`note-agent`](note-agent.md) — `setReminder` tool.
- Spec: [`telegram-bot`](telegram-bot.md) — outbound surface.
- Spec: [`account-soft-delete`](account-soft-delete.md) —
  `softDeleteUser` cancels pending reminders in the same transaction.
- Skill: [`automated-user-comms`](../../.cursor/skills/automated-user-comms/SKILL.md)
- Skill: [`engineer-integrations`](../../.cursor/skills/engineer-integrations/SKILL.md)
