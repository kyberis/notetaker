---
name: engineer-integrations
description: Integrations engineer for Will — owns Telegram Bot API, OpenAI (Whisper, vision, TTS), Vercel AI Gateway, Resend, Upstash, Vercel Blob, Turnstile, and Google OAuth. Invoke when adding/changing a third-party SDK, building a webhook, modifying the agent's model routing, or touching anything in src/lib/{ai,telegram,mail,blob,rate-limit,turnstile.ts}.
---

# Integrations Engineer — Will

## Mission

Will lives at the intersection of Telegram, OpenAI, and a handful of
optional Vercel-platform services. Every integration **must degrade
gracefully** when its env vars are missing — Will is MIT and self-hostable,
so a developer cloning the repo with only a `DATABASE_URL` and an
`OPENAI_API_KEY` should still get a working web app.

## Integration map

| Integration | Required? | Where | Env vars |
|-------------|-----------|-------|----------|
| **OpenAI** (Whisper, vision, TTS, fallback chat) | Yes | [`src/lib/ai/`](../../../src/lib/ai) | `OPENAI_API_KEY` |
| **Vercel AI Gateway** (chat routing) | Optional | [`src/lib/ai/run-note-agent.ts`](../../../src/lib/ai/run-note-agent.ts) | `AI_GATEWAY_API_KEY` or `VERCEL_OIDC_TOKEN` |
| **Telegram Bot API** | Optional | [`src/lib/telegram/`](../../../src/lib/telegram), webhook at [`src/app/api/webhooks/telegram/route.ts`](../../../src/app/api/webhooks/telegram/route.ts) | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_WEBHOOK_URL` |
| **Resend** (transactional email) | Recommended | [`src/lib/mail/resend.ts`](../../../src/lib/mail/resend.ts) | `RESEND_API_KEY`, `RESEND_FROM_ADDRESS` |
| **Upstash Redis** (rate limiting) | Recommended | [`src/lib/rate-limit.ts`](../../../src/lib/rate-limit.ts) | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| **Vercel Blob** (TTS audio storage) | Optional | [`src/lib/blob/tts.ts`](../../../src/lib/blob/tts.ts) | `BLOB_READ_WRITE_TOKEN` |
| **Turnstile** (signup captcha) | Optional | [`src/lib/turnstile.ts`](../../../src/lib/turnstile.ts) | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` |
| **Google OAuth** (sign-in) | Optional | NextAuth config | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |

When adding a new integration: copy the "graceful degradation" pattern from
[`src/lib/rate-limit.ts`](../../../src/lib/rate-limit.ts) — guard the SDK
import behind an env check; return a noop result when the env is missing;
log at `info` level so self-hosters see why it's off.

## OpenAI vs Vercel AI Gateway

| Use case | Provider | Why |
|----------|----------|-----|
| Chat / agent loop | **AI Gateway** when configured, falls back to direct OpenAI | Cost tracking + retries via Gateway when available; the agent must still run on a bare-bones self-host |
| Whisper (audio → text) | **OpenAI direct only** | Gateway does not support `audio.transcriptions` |
| Vision (photo → text) | **OpenAI direct only** | Used via `chat.completions` with `image_url`; routed through Gateway when configured |
| TTS (text → audio) | **OpenAI direct only** | Gateway does not support `audio.speech` |

Routing lives in [`src/lib/ai/run-note-agent.ts`](../../../src/lib/ai/run-note-agent.ts)
(`gateway(DEFAULT_MODEL)` — the AI SDK falls back to direct OpenAI if no
Gateway token is present). Models are referenced as
`provider/model` strings (`openai/gpt-4o-mini`). Override per environment
with `AI_MODEL`. Never hardcode an absolute model in feature code — pass it
in or read the env.

See [`knowledge/design-docs/ai-gateway-routing.md`](../../../knowledge/design-docs/ai-gateway-routing.md)
for the full rationale.

## Telegram Bot

The webhook ([`src/app/api/webhooks/telegram/route.ts`](../../../src/app/api/webhooks/telegram/route.ts))
is the single entry point for chat. It:

1. **Verifies the secret** (`X-Telegram-Bot-Api-Secret-Token` constant-time
   compared against `TELEGRAM_WEBHOOK_SECRET`).
2. **Drops non-private chats** (`message.chat.type !== "private"`).
3. **Rate-limits per Telegram user id** (Upstash, 10 / 60 s).
4. **Resolves the user** by `telegramUserId` or by `/start <code>` deep-link.
5. **Drops messages from soft-deleted or admin-disabled accounts** silently.
6. **Consumes the daily quota** ([`agent-quota.ts`](../../../src/lib/agent-quota.ts)).
7. **Materialises** text / voice / photo / PDF into a `{ text, source }` pair.
8. **Sends a "thinking" status message** to give the user motion.
9. **Runs the agent** with `runNoteAgent`, editing the status as tools fire.
10. **Replaces the status with the final reply**, plus optional TTS audio
    when `User.ttsEnabled === true`.

When changing this file:

- **Never bypass the secret check.**
- **Always return `200 { ok: true }`** for handled-but-ignored cases (rate
  limit, disabled user, soft-deleted user) — Telegram retries on non-2xx.
- **Use `withApi()` only for response shaping**, not in this handler — the
  Telegram client expects a fixed shape and the handler is already wrapped
  in try/catch around the agent call.

### Telegram outbound

Use the helpers in [`src/lib/telegram/client.ts`](../../../src/lib/telegram/client.ts):

- `sendTelegramMessage` — plain reply.
- `sendTelegramStatusMessage` + `editTelegramMessage` — the live "thinking"
  pattern. The helper swallows `message is not modified`.
- `deleteTelegramMessage` — replace status with final reply.
- `sendVoiceFromUrl` — used by the optional TTS flow with a Blob URL.
- `getTelegramFileUrl` + `downloadTelegramFile` — for voice / photo / PDF.

All outbound text passes through
[`formatAgentMarkdownForTelegramHtml`](../../../src/lib/telegram/format.ts)
so `**bold**` / `_italic_` / `` `code` `` render properly instead of
leaking asterisks.

## Cron jobs

Registered in [`vercel.json`](../../../vercel.json):

| Path | Schedule | Purpose |
|------|----------|---------|
| `/api/cron/reminders` | `* * * * *` (every minute) | Dispatch due `Reminder` rows via Telegram |
| `/api/cron/account-purge` | `0 3 * * *` (03:00 UTC daily) | Hard-delete users past the 30-day grace window |
| `/api/cron/deletion-reminders` | `0 9 * * *` (09:00 UTC daily) | Send T-7 / T-1 deletion warning emails |

When adding a cron:

- Verify the `CRON_SECRET` via `verifyCronRequest` from
  [`src/lib/auth/cron.ts`](../../../src/lib/auth/cron.ts).
- Wrap the body in `withApi`.
- **Register the new path in `vercel.json`** AND document it in the
  relevant spec under `knowledge/product-specs/`.

## Rate limiting

[`src/lib/rate-limit.ts`](../../../src/lib/rate-limit.ts) wraps Upstash
Redis. When Upstash env vars are missing it returns a permissive no-op
limiter (so self-hosters without Redis still work) and logs a warning.

Use `enforceLimit({ limiter, identifier, context })` instead of touching
the Upstash SDK directly.

Existing limiters:

- `tg-webhook` — 10 requests / 60 s per Telegram user id (in the bot
  webhook).
- Add new limiters with a unique `prefix` so keys don't collide.

## Email (Resend)

`sendMail({ to, subject, html, text })` from
[`src/lib/mail/resend.ts`](../../../src/lib/mail/resend.ts) is the only
sanctioned way to send email. It:

- Uses `RESEND_FROM_ADDRESS` as the sender.
- Returns silently when `RESEND_API_KEY` is missing (with an `info` log).
- Logs a warning on send failure but never throws — Will's flows treat
  email as best-effort.

Where it's used:

- `verification.ts` — email verification on signup.
- `account-deletion.ts` — T-7 / T-1 reminders.
- `reminders/dispatch.ts` — fallback when Telegram send fails after 3
  retries.

When adding a new email type, write it as a small helper that builds
the body and calls `sendMail` — don't inline the HTML into a route
handler.

## Vercel Blob (TTS audio)

[`src/lib/blob/tts.ts`](../../../src/lib/blob/tts.ts) uploads OpenAI TTS
output to a per-user prefix (`tts/<userId>/<timestamp>.opus`) and returns
a signed URL the Telegram bot can forward. Returns `null` when
`BLOB_READ_WRITE_TOKEN` is missing — TTS gracefully disables.

## Quality gates

Same as engineer-data:

- `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`.
- New integration → unit test for the helper function (mock the SDK via
  `vi.mock`).
- New integration → entry in `.env.example` with a comment explaining
  what fails when it's missing.

## Coordination

- For database concerns when integration writes a new model field: see
  [`engineer-data`](../engineer-data/SKILL.md).
- For privacy when integration sends user data to a third party: see
  [`legal-advisor`](../legal-advisor/SKILL.md). Anything that exfiltrates
  user content must be on the privacy page in
  [`marketing-content.ts`](../../../src/lib/marketing-content.ts).
- For copy in user-facing messages from the integration (emails,
  Telegram replies): see [`automated-user-comms`](../automated-user-comms/SKILL.md).
