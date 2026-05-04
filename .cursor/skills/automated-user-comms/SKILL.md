---
name: automated-user-comms
description: Rules for any text Will sends without a human in the loop at send time — Telegram bot replies (LLM-generated and templated), reminder messages, transactional emails, deletion warnings. Adds safety, honesty, and locale expectations on top of ux-writer's voice.
---

# Automated User Communications — Will

## Mission

Will speaks to users without a human in the loop. Every outbound message
is either AI-generated (the agent reply) or built from a template
(reminder fired, deletion warning, verification email). Both paths must
be **honest, locale-correct, and safe by default**.

This skill complements [`ux-writer`](../ux-writer/SKILL.md): voice and
tone live there; this skill is about the rails.

## What counts as "automated communication"

| Channel | Surface | Generation |
|---------|---------|------------|
| Telegram | Agent reply | LLM (`runNoteAgent`) |
| Telegram | "Thinking…" status | Templated, localised |
| Telegram | Reminder fired | Templated (`dict(locale).bot.reminderFired`) |
| Telegram | Quota exceeded | Templated |
| Telegram | Linked / not linked / link expired | Templated |
| Telegram | Voice too long / photo failed / PDF failed | Templated |
| Email | Verification | Templated |
| Email | Deletion warning T-7 / T-1 | Templated, localised |
| Email | Reminder fallback (after 3 Telegram fails) | Templated |

## Non-negotiables

1. **Locale is the user's, not the request's.** Use `User.locale` from
   the DB, not the `Accept-Language` header, for any message sent
   asynchronously (cron, webhook reply).
2. **No PII in logs.** `log.info(...)` and friends ([`src/lib/log.ts`](../../../src/lib/log.ts))
   may carry user ids and operation names — never note bodies, emails,
   or message text.
3. **AI replies must not invent capabilities.** The agent has a fixed
   tool set ([`src/lib/ai/note-tools.ts`](../../../src/lib/ai/note-tools.ts)).
   System prompts forbid promising features that don't exist (e.g. "I'll
   email you" — Will doesn't email reminders unless Telegram fails three
   times).
4. **AI replies must not give advice.** Will is not a doctor, lawyer,
   therapist, or financial advisor. The system prompts already say this;
   if you change them, keep that line.
5. **Soft-deleted users get nothing.** The reminder cron CANCELs any
   reminder for a user with `deletedAt != null`. The bot drops messages
   from deleted users silently. Add the same check to any new outbound
   path.
6. **Disabled users get nothing.** `User.isActive === false` (admin-set)
   = silent drop in the bot webhook, no proactive emails.
7. **Quota is checked before agent runs.** `consumeAgentQuota` increments
   first; if `ok: false`, send the templated quota message and skip the
   agent entirely. Saves cost and prevents the model from acknowledging a
   request it can't fulfil.
8. **Idempotency on email reminders.** Use a bitmask or a "sent" column
   to avoid double-sending. The deletion-reminder cron uses
   `User.deletionRemindersSent` (bit 0 = T-7, bit 1 = T-1).

## Templated copy lives in dictionaries

For Telegram bot strings:
- Source: [`src/lib/i18n/dictionaries/`](../../../src/lib/i18n/dictionaries)
  (one file per locale).
- Access: `dict(locale).bot.<key>`.
- Adding a new string = add it to **all four** locale files (en/es/pt/ar).

For email body strings:
- Currently inlined per-call in
  [`src/lib/account-deletion.ts`](../../../src/lib/account-deletion.ts)
  (locale-switched in `mailDeletionWarning`).
- For more than one or two emails per locale, factor into a per-locale
  email helpers folder (`src/lib/mail/i18n/`). Until then, mirror the
  inline `if (locale === ...)` pattern and keep all four languages in
  one place.

## AI-generated bot replies

The agent runs in [`src/lib/ai/run-note-agent.ts`](../../../src/lib/ai/run-note-agent.ts):

- System prompt per locale lives in [`src/lib/ai/prompts/`](../../../src/lib/ai/prompts).
- Step budget is 6. The model can call up to that many tools per turn.
- `temperature: 0.4` — kept low because we're saving notes, not writing
  poetry.
- `onStep` callback drives the live "thinking → saving → tagging" status
  message in Telegram. **Errors thrown by `onStep` must not break the
  agent loop** (they are caught and logged at warn level).

When you change a system prompt:

- Keep the "no advice", "use the tools", "ask before scheduling a
  reminder" rules. Removing any of them changes the user contract.
- Translate the same rules to the other three locales. Drift between
  prompts is a silent regression.
- After substantive changes, smoke-test in Telegram in each locale.

## Status messages (live progress)

The Telegram webhook sends a `sendTelegramStatusMessage` before the
agent runs and edits it as tools fire (via
[`src/lib/ai/tool-progress.ts`](../../../src/lib/ai/tool-progress.ts)).
Localised across all four languages. When you add a new tool:

- Add a label to `toolProgressLabel(toolName, locale)` for each locale.
- Default to "Working…" if no label is registered (don't crash).

## Reminder fired

Templated, sent by [`src/lib/reminders/dispatch.ts`](../../../src/lib/reminders/dispatch.ts):

```
🔔 <localised reminderFired prefix>: <note body>
```

- Body is HTML-escaped before send.
- Retry up to 3 times (1-minute cron). On the 3rd failure, send a
  fallback email (best-effort; failure logged but not raised).
- Soft-deleted user → CANCEL, never send.
- No `telegramChatId` on user → fall straight to the email path on first
  attempt failure.

## Deletion warnings

[`sendDeletionReminders`](../../../src/lib/account-deletion.ts) runs
daily. Picks any soft-deleted user whose grace remaining is exactly 7 or
1 days, sends the localised warning, and flips the bitmask.

When changing copy:

- Always include the day count and the action ("just sign in again to
  cancel").
- Keep all four locales in lockstep.
- Don't add "limited time offer" / dark patterns to dissuade deletion.
  We respect the user's choice.

## Adding a new automated message

Checklist:

- [ ] Pick channel: Telegram (templated or LLM-generated) or email.
- [ ] If templated: add to dictionary keys (all four locales) or to the
      inline locale switch.
- [ ] If LLM-generated: belongs in the agent loop. Don't fork a separate
      LLM call for ad-hoc replies — extend the agent.
- [ ] Locale source = `User.locale` from DB.
- [ ] Soft-delete + disabled checks.
- [ ] Quota / rate limit applied where appropriate.
- [ ] Honesty review (does the message promise something the code
      delivers?).
- [ ] Logged at `info` with operation name + user id, no body.
- [ ] Documented in the relevant
      [`knowledge/product-specs/<feature>.md`](../../../knowledge/product-specs).

## Coordination

- Voice and tone: [`ux-writer`](../ux-writer/SKILL.md).
- Sending the email: [`engineer-integrations`](../engineer-integrations/SKILL.md)
  (Resend section).
- Privacy posture for any new outbound channel:
  [`legal-advisor`](../legal-advisor/SKILL.md).
