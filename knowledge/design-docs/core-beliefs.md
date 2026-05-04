# core-beliefs

A handful of non-negotiable principles. Everything else is negotiable.

## 1. The repo is the memory

All durable knowledge lives in the repository. Agents should never need
to read external context, notebooks, or ask for tribal knowledge.

- Adding a user-visible feature means updating
  `knowledge/product-specs/` AND `src/lib/marketing-content.ts`
  (CHANGELOG + relevant marketing copy) AND (if it changes the data
  shape) the relevant Prisma migration.
- The `CHANGELOG` in `marketing-content.ts` is the single source of
  truth — it feeds both the public `/changelog` page and the JSON-LD
  that AI crawlers index. There is no parallel `release-notes.ts`.

See [`.cursor/rules/knowledge-base.mdc`](../../.cursor/rules/knowledge-base.mdc).

## 2. Telegram-first, web is calm

A new capability lands as a Telegram + agent-tool surface first. The web
is a read-only journal — tidy, scrollable, English-only — that exists so
the user has somewhere to read back what the bot has captured.

- Tools live in [`src/lib/ai/note-tools.ts`](../../src/lib/ai/note-tools.ts).
- A capability that exists only in the web UI but not as an agent tool
  should be flagged in its spec as a known gap.

## 3. Web UI is English-only

Multilingual support is for the conversation. Adding a new agent
language = adding a dictionary file in
[`src/lib/i18n/dictionaries/`](../../src/lib/i18n/dictionaries) and a
system prompt in [`src/lib/ai/prompts/`](../../src/lib/ai/prompts).

The marketing site, the `CHANGELOG`, and the dashboard stay in English.

## 4. Errors flow through `withApi()`

Route handlers stay tiny. Mapping Zod / business errors to HTTP responses
is centralised in [`src/lib/http.ts`](../../src/lib/http.ts). Never
`try/catch + rethrow` in handlers. See
[`with-api-error-handling`](with-api-error-handling.md).

## 5. AI uses the Gateway when it can

For chat / classification, models are referenced as `provider/model`
strings via the Vercel AI SDK + Gateway when an `AI_GATEWAY_API_KEY` /
`VERCEL_OIDC_TOKEN` is configured. Direct OpenAI is the fallback (and is
the **only** path for Whisper, vision, and TTS — Gateway doesn't support
those endpoints). See [`ai-gateway-routing`](ai-gateway-routing.md).

## 6. Voice — bardic on the page, plain in the chat

Will's marketing copy plays with the Twelfth Night wink ("What you
will"). Bot replies stay short and useful — the user is one tap away
from another chat. Two registers, one person. See
[`.cursor/skills/ux-writer/SKILL.md`](../../.cursor/skills/ux-writer/SKILL.md).

## 7. Self-hostable by default

Every optional integration (Telegram, Resend, Upstash, Blob, Turnstile,
AI Gateway) must degrade gracefully when its env vars are missing. The
MIT licence + self-host story is core to Will's positioning.

## 8. Tests for pure functions

Anything in `src/lib/**/*.ts` that does not touch the DB or the network
should have a Vitest unit test. Pure functions are cheap to test and
prevent the kind of drift that turns a chat agent into a liar.

## 9. Privacy is not negotiable

No third-party trackers. No telemetry beyond structured logs. PII never
appears in logs (`log.info` carries user ids and operation names — never
note bodies). Soft-deleted users get zero outbound messages. Every user
can export their full data and delete their account in two clicks. See
[`.cursor/skills/legal-advisor/SKILL.md`](../../.cursor/skills/legal-advisor/SKILL.md).

## 10. Will doesn't give advice

Will saves, tags, and reminds. Will is not a doctor, lawyer, therapist,
or financial advisor. The system prompts say this; if you change them,
keep that line.

## Related

- [`AGENTS.md`](../../AGENTS.md)
- [`.cursor/rules/`](../../.cursor/rules)
- [`.cursor/skills/`](../../.cursor/skills)
