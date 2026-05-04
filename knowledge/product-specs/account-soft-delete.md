# account-soft-delete

> Self-service "delete my account" with a 30-day grace window. The bot
> stops replying immediately; the data is hard-deleted later by a daily
> cron. Two warning emails are sent at T-7 and T-1, idempotent via a
> bitmask on `User`.

## What it does

1. User clicks **Settings → Delete account**.
2. `/api/account/delete` calls `softDeleteUser(userId)` which:
   - Sets `User.deletedAt = now()`.
   - Resets `User.deletionRemindersSent = 0`.
   - Cancels every PENDING `Reminder` for that user (in the same
     transaction).
3. The bot webhook drops messages from soft-deleted users silently
   (returns `200 { ok: true }`, no DB writes, no reply).
4. The reminders cron CANCELs any reminder it picks up for a
   soft-deleted user.
5. Daily at 09:00 UTC, the `deletion-reminders` cron sends a T-7 email
   and a T-1 email (idempotent via `User.deletionRemindersSent` bitmask:
   bit 0 = T-7, bit 1 = T-1).
6. Daily at 03:00 UTC, the `account-purge` cron hard-deletes any user
   whose `deletedAt < now() - 30 days`. Cascades clean every dependent
   row (Notes, Tags, NoteTags, Reminders, AgentMessageUsage, Account,
   Passkey, ApiToken, ContactMessage).
7. **Restore**: signing back in within the grace window clears
   `deletedAt` and `deletionRemindersSent` (handled by the auth flow).

## Where the code lives

| Layer | Path |
|-------|------|
| Service | [`src/lib/account-deletion.ts`](../../src/lib/account-deletion.ts) (`softDeleteUser`, `purgeExpiredAccounts`, `sendDeletionReminders`) |
| Constant | [`src/lib/legal.ts`](../../src/lib/legal.ts) — `ACCOUNT_DELETION_GRACE_DAYS = 30` |
| API | [`src/app/api/account/delete/route.ts`](../../src/app/api/account/delete/route.ts) |
| Cron: hard-delete | [`src/app/api/cron/account-purge/route.ts`](../../src/app/api/cron/account-purge/route.ts) |
| Cron: T-7 / T-1 emails | [`src/app/api/cron/deletion-reminders/route.ts`](../../src/app/api/cron/deletion-reminders/route.ts) |
| Cron registration | [`vercel.json`](../../vercel.json) |
| Email helper | [`src/lib/mail/resend.ts`](../../src/lib/mail/resend.ts) |
| Bot drop check | [`src/app/api/webhooks/telegram/route.ts`](../../src/app/api/webhooks/telegram/route.ts) (early return if `user.deletedAt`) |
| Reminder cancel on dispatch | [`src/lib/reminders/dispatch.ts`](../../src/lib/reminders/dispatch.ts) |
| UI | [`src/app/(authed)/settings/`](../../src/app/(authed)/settings) |

## Data model

`User`:

| Field | Type | Notes |
|-------|------|-------|
| `deletedAt` | `DateTime?` | `null` for active accounts. Set on soft-delete. `@@index([deletedAt])`. |
| `deletionRemindersSent` | `Int @default(0)` | Bitmask: bit 0 = T-7 sent, bit 1 = T-1 sent. Cleared on restore. |

The cascade contract on every model whose `userId` relates to `User`
uses `onDelete: Cascade` so the purge cron's `db.user.delete({...})`
cleans everything in one statement.

## Contracts

### Soft-delete

`softDeleteUser(userId, now?)`:

- Atomic transaction:
  - `User.update { deletedAt: now, deletionRemindersSent: 0 }`.
  - `Reminder.updateMany { where: { userId, status: PENDING }, data: {
    status: CANCELLED, cancelledAt: now } }`.

### Hard-delete (cron)

`purgeExpiredAccounts(now?)` → returns count purged. Picks
`User.findMany({ where: { deletedAt: { lte: now - 30d } } })` and
`db.user.delete({...})` each one. Errors per user are logged at warn
level but do not abort the batch.

### Reminder emails (cron)

`sendDeletionReminders(now?)` → returns `{ t7, t1 }`. For each
soft-deleted user:

- Compute `remaining` days until purge (`ceil`).
- If `remaining === 7` and bit 0 not set → send T-7, set bit 0.
- If `remaining === 1` and bit 1 not set → send T-1, set bit 1.

Localised inline per locale (en / es / pt / ar). Email title:
`"Will: <N> day(s) until account deletion"`.

## Invariants

- **Soft-deleted users get zero outbound.** Bot drops messages,
  reminder cron cancels reminders, deletion-reminder cron is the only
  exception (and only twice per account: T-7 and T-1).
- **Bitmask is idempotent.** Re-running the daily cron the same day
  does not re-send.
- **Cancellation is atomic with soft-delete.** A user cannot be
  soft-deleted with PENDING reminders.
- **Restore window is exactly 30 days.** `ACCOUNT_DELETION_GRACE_DAYS`
  is the single source of truth — change it here and the cron picks
  up the new value automatically.
- **Cascade integrity.** Purging a user deletes every dependent row
  via Prisma cascade. No orphan rows. No manual cleanup of
  `AgentMessageUsage` / `ApiToken` etc.
- **Account purge runs at 03:00 UTC; deletion reminders at 09:00
  UTC.** Both schedules are in `vercel.json`. Do not change without
  updating this spec.

## Known gaps / TODOs

- We don't email a confirmation when the soft-delete is requested
  (the user knows they clicked it, but a confirmation closes the loop
  for support).
- We don't offer a "delete now" path that bypasses the 30-day grace.
  Some users want immediate deletion for privacy reasons; future
  enhancement.
- The T-7 / T-1 emails use simple inline HTML. If branded HTML is
  desired, factor into per-locale email templates.
- We don't check whether T-7 was missed (e.g. a user soft-deleted 5
  days ago when the cron skipped). The bitmask check skips T-7 if the
  remaining count drops past 7 between cron runs.

## Related

- Design doc: [`core-beliefs`](../design-docs/core-beliefs.md) —
  privacy posture.
- Spec: [`gdpr-compliance`](gdpr-compliance.md) — broader compliance
  surface.
- Spec: [`reminders`](reminders.md) — cancel behaviour.
- Spec: [`telegram-bot`](telegram-bot.md) — silent drop check.
- Skill: [`legal-advisor`](../../.cursor/skills/legal-advisor/SKILL.md)
- Skill: [`automated-user-comms`](../../.cursor/skills/automated-user-comms/SKILL.md)
