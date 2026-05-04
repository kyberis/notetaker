# gdpr-compliance

> Demonstrable consent, full data export, account deletion with grace,
> contact form, and "no third-party trackers" — the GDPR baseline that
> Will markets on.

## What it does

- **Consent**: every user has `acceptedTermsAt` + `acceptedTermsVersion`
  stamped when they actively accept the current Terms + Privacy.
  Users with `acceptedTermsVersion < CURRENT_TERMS_VERSION` are routed
  to `/accept-terms` to re-consent (GDPR Art. 7(1)).
- **Right of access (Art. 15) + portability (Art. 20)**:
  `/api/account/export` returns a single JSON file with all the user's
  notes, tags, reminders, and identity metadata.
- **Right to erasure (Art. 17)**: `/api/account/delete` soft-deletes
  with a 30-day grace; the daily purge cron hard-deletes after the
  window. See [`account-soft-delete`](account-soft-delete.md).
- **Right to object / contact**: `/contact` route accepts privacy /
  abuse / bug / general messages, persisted in `ContactMessage`.
- **No third-party trackers**: no Google Analytics, no Facebook Pixel,
  no Hotjar, no marketing cookies. Strictly required cookies only
  (session).
- **Sub-processor list**: maintained in the privacy page in
  [`marketing-content.ts`](../../src/lib/marketing-content.ts) —
  Telegram, OpenAI, Vercel AI Gateway, Resend, Upstash, Vercel, Neon.

## Where the code lives

| Layer | Path |
|-------|------|
| Terms version constant | [`src/lib/legal.ts`](../../src/lib/legal.ts) — `CURRENT_TERMS_VERSION` |
| Grace constant | [`src/lib/legal.ts`](../../src/lib/legal.ts) — `ACCOUNT_DELETION_GRACE_DAYS` (30) |
| Consent stamp | [`src/app/api/account/accept-terms/route.ts`](../../src/app/api/account/accept-terms/route.ts) |
| Accept-terms gate UI | [`src/app/(auth)/accept-terms/`](../../src/app/(auth)) |
| Data export | [`src/app/api/account/export/route.ts`](../../src/app/api/account/export/route.ts) |
| Account deletion | [`src/app/api/account/delete/route.ts`](../../src/app/api/account/delete/route.ts) → [`src/lib/account-deletion.ts`](../../src/lib/account-deletion.ts) |
| Contact form | [`src/app/api/contact/route.ts`](../../src/app/api/contact/route.ts) |
| Contact model | [`prisma/schema.prisma`](../../prisma/schema.prisma) — `ContactMessage`, `ContactMessageKind` |
| Privacy page (marketing) | [`src/app/(marketing)/`](../../src/app/(marketing)) + claims in [`marketing-content.ts`](../../src/lib/marketing-content.ts) |
| Used verification token log | [`prisma/schema.prisma`](../../prisma/schema.prisma) — `UsedVerificationToken` (idempotency for email-verification JWTs) |

## Data model

User-side fields used for compliance:

| Field on `User` | Purpose |
|-----------------|---------|
| `email` | Identity. Used for export delivery + deletion warnings. |
| `acceptedTermsAt` | GDPR Art. 7(1) — when the user consented. |
| `acceptedTermsVersion` | Which Terms + Privacy version. Bump `CURRENT_TERMS_VERSION` to force re-consent. |
| `deletedAt` | Soft-delete marker. |
| `deletionRemindersSent` | Bitmask for idempotent T-7 / T-1 emails. |
| `createdAt` | Retention reasoning. |

`ContactMessage`:

| Field | Type | Notes |
|-------|------|-------|
| `kind` | `ContactMessageKind` (`PRIVACY | ABUSE | BUG | GENERAL`) | DSAR / abuse get tighter SLA. |
| `name`, `email`, `body` | text | Required. |
| `userId` | `String?` | Set if logged in (`SetNull` on user delete). |
| `ip`, `userAgent` | text | For abuse triage. |
| `readAt`, `repliedAt`, `archivedAt` | `DateTime?` | Admin inbox state. |

`UsedVerificationToken`:

| Field | Type | Notes |
|-------|------|-------|
| `jti` | `String @id` | JWT id of a consumed verification token. Prevents replay within JWT expiry. |

## Contracts

### Data export

`GET /api/account/export` (authenticated):

- Returns a JSON dump with the user's identity, notes (with tags),
  reminders, agent usage rollup, and any contact messages they sent
  while signed in.
- No queue, no email — instant download.
- Sensitive fields (password hash, Telegram link code, OAuth refresh
  tokens) are NOT included.

### Account delete

`POST /api/account/delete` (authenticated):

- Calls `softDeleteUser(userId)`.
- Returns `200 { ok: true }`.
- The user is signed out by the auth flow on next request.

See [`account-soft-delete`](account-soft-delete.md) for the lifecycle.

### Contact form

`POST /api/contact`:

- Public (Turnstile-gated when configured).
- Persists `ContactMessage` with `kind`, `name`, `email`, `body`.
- Optional `userId` if the requester is signed in.

### Consent re-stamp

`POST /api/account/accept-terms` (authenticated):

- Sets `acceptedTermsAt = now()`, `acceptedTermsVersion =
  CURRENT_TERMS_VERSION`.
- Idempotent.

## Invariants

- **Bumping `CURRENT_TERMS_VERSION` triggers re-consent.** Existing
  users land on `/accept-terms` until they re-stamp.
- **Account deletion is reversible within 30 days.** Sign-in clears
  `deletedAt`. After 30 days, data is gone.
- **Cascade is the cleaner.** No model has its own delete script —
  the `User` cascade handles it.
- **PII never appears in logs.** Logger
  ([`src/lib/log.ts`](../../src/lib/log.ts)) is fed identifiers only.
- **No third-party trackers.** Adding analytics requires legal review
  and a privacy-page update.
- **`ContactMessage` retains `userId` only as a `SetNull` on user
  delete** — the message itself stays for support / audit, but the
  link to the (now hard-deleted) user is severed.
- **Verification tokens are single-use within their JWT window.**
  `UsedVerificationToken.jti` is the dedup key.

## Known gaps / TODOs

- The contact admin inbox UI (`/admin/contact`) is reserved but not
  shipped. Reading messages today happens via the DB.
- We don't yet expose a "see all your data" UI — only the export JSON.
  A simple data-summary page would meet some users' Art. 15 needs
  without needing to download the JSON.
- We don't have automated retention / cleanup beyond the soft-delete
  cron. If we ever store sensitive logs, we'll need a retention
  schedule.
- The privacy page is a code-resident document (in marketing copy).
  This makes it auditable and version-controlled, but means
  non-engineer edits go through a PR.

## Related

- Design doc: [`core-beliefs`](../design-docs/core-beliefs.md) —
  privacy is non-negotiable.
- Spec: [`account-soft-delete`](account-soft-delete.md)
- Spec: [`telegram-bot`](telegram-bot.md) — silent drop on deleted
  users.
- Skill: [`legal-advisor`](../../.cursor/skills/legal-advisor/SKILL.md)
- Rule: [`legal-compliance`](../../.cursor/rules/legal-compliance.mdc)
