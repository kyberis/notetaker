---
name: legal-advisor
description: Reviews and enforces legal compliance for Will — GDPR (consent, export, soft-delete, retention), AI data flows, third-party processors, marketing claims, security headers, and account lifecycle. Use when any change touches user data, AI prompts, third-party integrations, signup/consent flows, marketing copy, or cookies/sessions.
---

# Legal Advisor — Will

## Mission

Will is GDPR-grade out of the box. The product positioning rests on three
concrete promises:

1. **No third-party trackers.** Plausible-style analytics only if we ever
   add them; never Google Analytics / Facebook Pixel / etc.
2. **Demonstrable consent.** Every user has `acceptedTermsAt` +
   `acceptedTermsVersion` stamped on their record (GDPR Art. 7(1)).
3. **Self-service export and deletion.** `/api/account/export` returns a
   single JSON; `/api/account/delete` soft-deletes with a 30-day grace,
   then the cron hard-deletes via cascading relations.

A change that breaks any of those is a legal regression. Treat them as
non-negotiable.

## When to involve this skill

Read this skill **before** completing a change that:

1. **Collects new user data** — a new form field, API parameter, or stored
   value derived from user input.
2. **Adds or changes a third-party service** — new API integration, SDK,
   analytics provider, or external data processor (a model swap, a new
   Vercel sub-product, a Telegram feature that exposes new fields).
3. **Modifies AI features** — changes to prompts, the data Will sends to
   the model, the tools the agent can call, or how AI output is displayed.
4. **Changes signup, login, or consent flows** — Google sign-in, email +
   password, passkey, accept-terms gate, deletion grace window.
5. **Updates marketing copy** — landing, FAQ, privacy, changelog,
   `llms.txt`, especially claims about security, privacy, "open source",
   or self-hostability.
6. **Modifies cookies / sessions** — adding cookies, changing JWT
   lifetime, adding client-side storage, broadening CORS.
7. **Changes data export or deletion** — `/api/account/export`,
   `/api/account/delete`, account purge cron, deletion-reminder emails.
8. **Modifies middleware or security headers** — `src/proxy.ts`,
   CSP, CSRF, rate limiting, signed-webhook verification.

## Key documents and code

- **Privacy page**: in
  [`src/lib/marketing-content.ts`](../../../src/lib/marketing-content.ts)
  (look for `PRIVACY_*` exports or the marketing privacy page under
  `src/app/(marketing)/`). Single source of truth — never write a parallel
  page elsewhere.
- **Terms version**: `CURRENT_TERMS_VERSION` in
  [`src/lib/legal.ts`](../../../src/lib/legal.ts). **Bump this when the
  Terms or Privacy text materially changes** so existing users get
  re-consented at `/accept-terms`.
- **Consent stamping**: the `/api/account/accept-terms` route writes
  `acceptedTermsAt` + `acceptedTermsVersion` on `User`.
- **Soft-delete + grace**: `ACCOUNT_DELETION_GRACE_DAYS` = 30, defined in
  [`src/lib/legal.ts`](../../../src/lib/legal.ts), used by
  [`account-deletion.ts`](../../../src/lib/account-deletion.ts) and the
  daily cron.
- **License**: [`LICENSE`](../../../LICENSE) — MIT. Will is genuinely
  self-hostable; "self-hostable" appears in marketing only because the
  optional integrations all degrade gracefully (see
  [`engineer-integrations`](../engineer-integrations/SKILL.md)).

## GDPR checklist

When **adding a new field that stores user data**:

- [ ] The field is documented in the relevant
  [`knowledge/product-specs/<feature>.md`](../../../knowledge/product-specs).
- [ ] The field is included in the JSON returned by
  `/api/account/export` (so the user gets *all* their data).
- [ ] The field is dropped by the `User` cascade on hard delete (i.e. it
  lives on a model whose relation to `User` has `onDelete: Cascade`).
- [ ] The privacy page in `marketing-content.ts` mentions the new
  category if it's not covered by a generic class ("the notes you write",
  "tags you create", etc.).
- [ ] **No PII in logs.** `src/lib/log.ts` is the only sanctioned logger;
  pass identifiers (user id) but not contents (note bodies, emails).

When **adding a new third-party processor**:

- [ ] The integration degrades gracefully when its env is missing.
- [ ] The privacy page lists it as a sub-processor (Telegram, OpenAI,
  AI Gateway, Resend, Upstash, Vercel, Neon are already listed; add
  the new one).
- [ ] If the integration sends user data, document **what data, what
  purpose, what retention** in the relevant spec.
- [ ] The README / `.env.example` documents the env vars.

When **modifying AI prompts or tool surface**:

- [ ] No PII is inlined into the prompt that the user wouldn't expect to
  send. The user's note bodies are fine — they wrote them. Other users'
  data is never permitted in a prompt.
- [ ] If the agent now writes to a new resource, the spec lists which
  tool does it.
- [ ] Marketing claims about AI ("we don't train on your data") match
  reality. OpenAI and Vercel AI Gateway both have data-handling clauses
  Will relies on; do not promise more than they offer.

## Marketing claims — what we may say

Safe to say:

- "Open source (MIT)."
- "Self-hostable on Vercel, Fly, Railway, or your own box."
- "GDPR-compliant: full export, 30-day soft-delete with grace, no
  third-party trackers."
- "Whisper transcribes voice; vision captions photos." (factual)
- "We use OpenAI GPT-4o-mini by default." (factual; document the model
  swap escape hatch via `AI_MODEL`)

Do not say:

- "Encrypted end-to-end." (We're not — Postgres at rest is encrypted by
  the host, but Will reads plaintext.)
- "Anonymous." (We have an email and optionally a Telegram identity.)
- "We never look at your data." (We don't proactively, but admins on a
  self-host *can*; on the hosted service the maintainer can in case of
  abuse.)
- "HIPAA compliant" / "Bank-grade." (Marketing fluff that legal will
  not back.)

## Account deletion playbook

The flow is:

1. User hits **Settings → Delete account** → calls
   `/api/account/delete`.
2. `softDeleteUser(userId)` sets `User.deletedAt = now()`,
   `User.deletionRemindersSent = 0`, and flips every
   `Reminder.status: PENDING → CANCELLED` for that user.
3. The bot webhook drops messages from soft-deleted users silently
   (see step 4 of the Telegram handler).
4. The reminders cron CANCELs any reminder it picks up for a
   soft-deleted user.
5. The daily `deletion-reminders` cron sends a T-7 email and a T-1
   email (idempotent via the `deletionRemindersSent` bitmask).
6. The daily `account-purge` cron hard-deletes any user whose
   `deletedAt < now() - 30 days`. Cascades clean the rest.
7. Restore = sign back in within the grace window. The auth flow clears
   `deletedAt` and `deletionRemindersSent`.

**Do not change this flow without legal review.** The 30-day window is
documented in marketing copy and the privacy page; users plan around it.

## Quick checks (no full review needed)

If the change is purely cosmetic (styling, layout) or internal (refactor
without behaviour change), no legal review is needed. But verify:

- No new data fields are being persisted.
- No new third-party requests are being made.
- Privacy claims in `marketing-content.ts` (no telemetry, MIT,
  self-hosted) remain accurate.
- The CHANGELOG doesn't promise something the code doesn't deliver.

## Coordination

- For schema fields and cascade behaviour: see
  [`engineer-data`](../engineer-data/SKILL.md).
- For new third-party integrations: see
  [`engineer-integrations`](../engineer-integrations/SKILL.md).
- For new copy: see [`ux-writer`](../ux-writer/SKILL.md).
- For deletion reminders + transactional copy: see
  [`automated-user-comms`](../automated-user-comms/SKILL.md).
