# telegram-bot

> The product's primary surface: a Telegram bot that turns text / voice
> / photo / PDF into notes via the agent, with deep-link account
> linking, live status messages, and optional voice replies.

## What it does

- A web user clicks "Connect Telegram" in Settings → opens
  `https://t.me/<botUsername>?start=<code>` → the bot replies "linked"
  on first message.
- After linking, every message the user sends Will (text, voice, photo,
  PDF) gets:
  1. Transcribed / extracted into plain text.
  2. Run through the agent (`runNoteAgent`), which saves a note,
     suggests tags, and may schedule a reminder.
  3. Replied to with a short confirmation.
- A "thinking" status message is edited in place during the agent run
  ("Saving your note…", "Suggesting tags…", "Scheduling a reminder…")
  so the user sees motion instead of a silent typing dot.
- If `User.ttsEnabled === true`, the bot also sends a voice version of
  the reply via OpenAI TTS + Vercel Blob.
- Group chats are politely declined ("private 1:1 only").

## Where the code lives

| Layer | Path |
|-------|------|
| Webhook entrypoint | [`src/app/api/webhooks/telegram/route.ts`](../../src/app/api/webhooks/telegram/route.ts) |
| Telegram client | [`src/lib/telegram/client.ts`](../../src/lib/telegram/client.ts) |
| Markdown → HTML formatter | [`src/lib/telegram/format.ts`](../../src/lib/telegram/format.ts) |
| Deep-link codes | [`src/lib/telegram/link.ts`](../../src/lib/telegram/link.ts) |
| Whisper transcription | [`src/lib/ai/transcribe.ts`](../../src/lib/ai/transcribe.ts) |
| Vision + PDF extraction | [`src/lib/ai/extract.ts`](../../src/lib/ai/extract.ts) |
| TTS audio | [`src/lib/ai/text-to-speech.ts`](../../src/lib/ai/text-to-speech.ts), [`src/lib/blob/tts.ts`](../../src/lib/blob/tts.ts) |
| Bot dictionary | [`src/lib/i18n/dictionaries/`](../../src/lib/i18n/dictionaries) (per-locale, accessed via `dict(locale).bot.<key>`) |
| Tool progress labels | [`src/lib/ai/tool-progress.ts`](../../src/lib/ai/tool-progress.ts) |
| Settings UI for linking | [`src/app/(authed)/settings/telegram/`](../../src/app/(authed)/settings) |
| Webhook setup script | `scripts/telegram-webhook.ts` (not in this folder; see `npm run telegram:webhook`) |

## Data model

- `User.telegramUserId` (BigInt unique) — Telegram's stable id.
- `User.telegramUsername` — informational only (users change it).
- `User.telegramChatId` (BigInt) — outbound destination.
- `User.telegramVerifiedAt` — set on link.
- `User.telegramLinkCode` + `telegramLinkCodeExpires` — see
  [`telegram-deep-link-tokens`](../design-docs/telegram-deep-link-tokens.md).
- `User.ttsEnabled` — opt-in for audio replies (default `false`).

Note rows created via this surface get `Note.source` set to the
matching `NoteSource` enum value (`TELEGRAM_TEXT`, `TELEGRAM_VOICE`,
`TELEGRAM_PHOTO`, `TELEGRAM_PDF`).

## Contracts

### Inbound webhook

- **Method**: `POST /api/webhooks/telegram`.
- **Auth**: `X-Telegram-Bot-Api-Secret-Token` header, constant-time
  compared against `TELEGRAM_WEBHOOK_SECRET`. Wrong / missing → 403.
- **Body**: Telegram `Update` JSON. We handle `message` and
  `edited_message`.
- **Response**: always `200 { ok: true }` for handled-but-ignored
  cases (rate limit, disabled user, soft-deleted user, group chat,
  unknown message type) — Telegram retries on non-2xx.

### Outbound

All outbound text:

- Goes through `formatAgentMarkdownForTelegramHtml` so `**bold**` /
  `_italic_` / `` `code` `` render as Telegram HTML.
- TTS uses `stripAgentMarkdown` (markup reads terribly aloud).

### Materialised content sources

| Inbound | Pipeline | `NoteSource` |
|---------|----------|--------------|
| `message.text` | passthrough | `TELEGRAM_TEXT` |
| `message.voice` (≤ 600 s) | Whisper STT | `TELEGRAM_VOICE` |
| `message.photo[last]` | OpenAI vision (`gpt-4o` chat with `image_url`) | `TELEGRAM_PHOTO` |
| `message.document` (mime `application/pdf`) | PDF text extraction | `TELEGRAM_PDF` |

Caption text is appended in parentheses to the extracted text when
present.

## Invariants

- **Webhook authentication first.** No code path runs before the
  signature check.
- **Private chats only.** `message.chat.type !== "private"` → polite
  reply, return.
- **Per-Telegram-user rate limit** (Upstash, 10 req / 60 s) before
  any work begins. Above-limit requests get `200 { ok: true }` with no
  reply.
- **Soft-deleted user → silent drop.** No outbound, no DB writes
  beyond the existing user lookup.
- **Disabled user (`isActive: false`) → silent drop.**
- **Quota check before agent.** `consumeAgentQuota` is called before
  `runNoteAgent`.
- **Voice ≤ 10 minutes.** Longer voice notes get a localised "voice
  too long" reply.
- **Status message lifecycle.** `sendTelegramStatusMessage` →
  `editTelegramMessage` (per step) → `deleteTelegramMessage` (before
  final reply). If status creation fails (transient network), the
  agent still runs; user falls back to typing dot only.
- **TTS is best-effort.** Failures log at warn level but don't break
  the text reply.
- **`/start <code>` is consumed atomically.** `resolveUser()` clears
  the code on success so it can't be re-used.

## Known gaps / TODOs

- We don't handle Telegram `callback_query` (inline keyboards) — tag
  suggestions today are inline text instead of buttons. Adding inline
  buttons would tighten the "tap to confirm tag" UX.
- We don't handle Telegram `media_group` (album upload) — multi-photo
  posts process the first photo only.
- Voice transcription language is hinted from `User.locale`; multi-lingual
  users mid-conversation may get suboptimal Whisper output.
- TTS files are uploaded per-message and never cleaned up. A daily
  cleanup of `/tts/<userId>/*` older than 7 days would be cheap and
  harmless.
- We retry failed sends in the reminder cron but not in the webhook
  itself. A 5xx from Telegram during reply means the user sees no
  response (the note IS saved by the agent, though).
- Group chats are rejected; we don't attempt a "group mode" because the
  per-user data model doesn't fit.

## Related

- Design doc: [`telegram-deep-link-tokens`](../design-docs/telegram-deep-link-tokens.md)
- Design doc: [`multilingual-prompts`](../design-docs/multilingual-prompts.md)
- Spec: [`note-agent`](note-agent.md)
- Spec: [`agent-quota`](agent-quota.md)
- Spec: [`reminders`](reminders.md)
- Skill: [`engineer-integrations`](../../.cursor/skills/engineer-integrations/SKILL.md)
- Skill: [`automated-user-comms`](../../.cursor/skills/automated-user-comms/SKILL.md)
