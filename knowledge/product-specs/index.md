# Product specs index

One spec per feature, alphabetical. Each spec is a short markdown
document following
[`../templates/product-spec.template.md`](../templates/product-spec.template.md).

> Specs describe **what** a feature does and **how** an engineer / agent
> changes it safely. Specs are not marketing copy — that lives in
> [`src/lib/marketing-content.ts`](../../src/lib/marketing-content.ts).

## Live specs

- [`account-soft-delete`](account-soft-delete.md) — self-service "delete
  my account" with a 30-day grace queue. Daily cron hard-deletes past
  the window; bot and reminders are paused while pending; T-7 / T-1
  warning emails are idempotent.
- [`agent-quota`](agent-quota.md) — per-user daily cap on agent
  messages (default 30/day, combined web + Telegram). Atomic upsert,
  templated quota-exceeded message in all four locales.
- [`gdpr-compliance`](gdpr-compliance.md) — demonstrable consent
  (`acceptedTermsAt` + `acceptedTermsVersion`), data export, account
  deletion with grace, contact form, retention windows.
- [`note-agent`](note-agent.md) — chat agent loop, seven tools, AI
  Gateway routing, multilingual system prompts, step budget, tool
  progress streaming.
- [`notes-and-tags`](notes-and-tags.md) — `Note` + `Tag` + `NoteTag`
  data model, per-user tag namespace, source channels (TELEGRAM_TEXT /
  VOICE / PHOTO / PDF / WEB), normalization rules.
- [`reminders`](reminders.md) — `Reminder` lifecycle, 1-minute cron
  dispatcher, retry budget (3), email fallback, cancellation on
  soft-delete.
- [`telegram-bot`](telegram-bot.md) — webhook entrypoint, deep-link
  vinculation, ingest pipeline (text / voice / photo / PDF), live
  status messages, optional TTS audio replies.
- [`web-journal`](web-journal.md) — read-only daily journal in
  `/(authed)/app`, day-grouped, tag filters, quick-add (web → bot
  symmetry under construction).

## Suggested first specs (write when touching)

- **auth** — NextAuth + email + Google + passkeys, accept-terms gate,
  email verification idempotency.
- **admin-console** — `/admin` overview + user list + per-user enable
  / disable.
- **marketing-pages** — `(marketing)/` routes, `LANDING_COPY` shape,
  `/changelog`, `/faq`, `/privacy`.
- **seo-and-llms** — `sitemap.ts`, `robots.ts`, `llms.txt`,
  `llms-full.txt`, JSON-LD on landing.
- **i18n** — locale resolution order, dictionary structure, RTL
  handling for Arabic.

Add new specs by copying
[`../templates/product-spec.template.md`](../templates/product-spec.template.md)
and linking them above.
