---
name: qa-tester
description: Test strategy and quality gates for Will — Vitest-only suite. Owns the manual + automated regression posture, with emphasis on the agent loop, agent tools, Telegram pipeline, reminder dispatch, and i18n hygiene. Use when planning tests, writing tests, validating regressions, or preparing release confidence.
---

# QA Tester — Will

## Mission

Keep Will honest. The product is a chat-first AI agent that writes to
users' notes — so the test suite is biased toward **the parts where a
hallucination, a silent failure, or a missed validation would corrupt a
journal**. UI coverage matters less; correctness of agent tools, the
reminder cron, and the Telegram pipeline matters most.

## Test stack

- **Unit + integration**: [Vitest](https://vitest.dev) only.
  - Config: [`vitest.config.ts`](../../../vitest.config.ts).
  - Pattern: `src/**/*.{test,spec}.{ts,tsx}`.
  - Environment: `node` (the suite is library + helper focused, not
    component-rendering focused).
- **No Playwright / no e2e**. Will is small and the chat agent + Telegram
  surface is awkward to drive through Playwright. If we ever add a
  critical user-visible web flow that's hard to verify any other way,
  add an `e2e/` suite then — until then push effort into agent loop and
  tool contracts.
- **CI**: `.github/workflows/ci.yml` runs `npm run lint && npx tsc
  --noEmit && npm test && npm run build` on every push/PR.

## What to test (and how)

| Surface | Why it matters | Reference test |
|---------|----------------|----------------|
| **Agent tools** ([`src/lib/ai/note-tools.ts`](../../../src/lib/ai/note-tools.ts)) | Tools mutate user data through the agent loop. Schemas, side effects, output shape must be locked down. | _add tests under `src/lib/ai/`_ |
| **Agent loop** ([`src/lib/ai/run-note-agent.ts`](../../../src/lib/ai/run-note-agent.ts)) | Step budget, model fallback, onStep callbacks. | _mock `gateway()` and `generateText`_ |
| **Reminder dispatch** ([`src/lib/reminders/dispatch.ts`](../../../src/lib/reminders/dispatch.ts)) | Concurrency, retry budget, fallback email, soft-delete skip — silent bugs here lose user trust forever. | _mock `db`, `sendTelegramMessage`, `sendMail`_ |
| **Telegram link tokens** ([`src/lib/telegram/link.ts`](../../../src/lib/telegram/link.ts)) | Deep-link flow gates the bot. Length cap + URL-safe alphabet are enforced here. | [`src/lib/telegram/link.test.ts`](../../../src/lib/telegram/link.test.ts) |
| **Telegram format** ([`src/lib/telegram/format.ts`](../../../src/lib/telegram/format.ts)) | Markdown → HTML conversion + escape; user trust depends on bold/italic rendering. | [`src/lib/telegram/format.test.ts`](../../../src/lib/telegram/format.test.ts) |
| **Tag normalization** ([`src/lib/notes/tags.ts`](../../../src/lib/notes/tags.ts)) | Per-user tag namespace requires consistent normalization. | [`src/lib/notes/tags.test.ts`](../../../src/lib/notes/tags.test.ts) |
| **Day buckets** ([`src/lib/notes/day-bucket.ts`](../../../src/lib/notes/day-bucket.ts)) | Web journal grouping must be UTC-correct. | [`src/lib/notes/day-bucket.test.ts`](../../../src/lib/notes/day-bucket.test.ts) |
| **Locale primitives** ([`src/lib/i18n/locale.ts`](../../../src/lib/i18n/locale.ts)) | Resolution order between user pref / cookie / Accept-Language. | [`src/lib/i18n/locale.test.ts`](../../../src/lib/i18n/locale.test.ts) |
| **Cost helper** ([`src/lib/ai/...`](../../../src/lib/ai)) | Provider routing has subtle env-var fallbacks. | _mirror Clara's [`cost.test.ts`](../../../external/etracker/src/lib/ai/cost.test.ts) pattern when adding cost helpers_ |
| **SEO** ([`src/lib/seo.ts`](../../../src/lib/seo.ts)) | Marketing layer doubles as the LLM-facing API. | [`src/lib/seo.test.ts`](../../../src/lib/seo.test.ts) |

## Patterns to copy

### Agent tool tests

- Mock `@/lib/db`, `@/lib/notes/persistence`, and `@/lib/reminders/schedule`
  at the module boundary with `vi.mock(...)`.
- Build the tools with `buildNoteTools({ userId: "test-user", defaultSource:
  "TELEGRAM_TEXT" })` and call `tool.execute(input)` directly.
- Assert on **input parsing** (Zod errors), **DB / service calls made**,
  and **output shape** the agent will see.
- Always cover at least one failure path (validation error, not-found,
  service throw).

### Cron tests

- Use `vi.useFakeTimers()` so `now` is deterministic.
- Seed a tiny in-memory test DB shape via `vi.mock` returning the
  records you need.
- Assert side effects per record: SENT / CANCELLED / FAILED counters,
  fallback email called only after the third attempt.

### Telegram webhook tests

The webhook is **integration-shaped**: it composes user resolution,
materialisation, agent run, status messages, and TTS. Test it by mocking
the boundary functions:

- `verifyTelegramWebhookRequest` → return `true`.
- `runNoteAgent` → return a fixed `{ text, inputTokens, outputTokens }`.
- `sendTelegramMessage` / `editTelegramMessage` / `deleteTelegramMessage`
  → spy on call args.

Cover:

- Happy path: text in → 200 + reply sent.
- Voice path: voice in → Whisper called → reply sent.
- Soft-deleted user → 200 with no reply.
- Disabled user → 200 with no reply.
- Quota exceeded → reply with quota message.
- Group chat → "private only" reply.

### Webhook security

- Verify signature (`X-Telegram-Bot-Api-Secret-Token` constant-time
  compare) **before** parsing body.
- Verify graceful degradation: missing env (`TELEGRAM_BOT_TOKEN`)
  returns a typed error, not a 500.

## What to NOT test

- Don't test third-party SDKs themselves (OpenAI client, Resend client,
  Upstash). Mock them.
- Don't snapshot agent text replies — the model is non-deterministic.
  Test the tool calls and side effects instead.
- Don't test private helpers — only the public surface a route or another
  module would call.

## Manual smoke test (before pushing to main)

Web:

- [ ] Sign up with email → verify email → log in → see `/app` empty state.
- [ ] Sign up with Google → land on `/app`.
- [ ] Settings → Connect Telegram → click deep link → bot says "linked".
- [ ] `/api/account/export` returns valid JSON.
- [ ] `/changelog` renders the latest version.

Telegram:

- [ ] Send text → "Saved." reply.
- [ ] Send voice → transcript → "Saved." reply.
- [ ] Send "remind me tomorrow at 9am to call mum" → reminder offered →
      "Yes" → wait → bell fires.
- [ ] Photo with text → vision extracts → "Saved." reply.
- [ ] PDF → extract → "Saved." reply.
- [ ] Hit the daily quota (30) → "limit" reply.
- [ ] Soft-delete account → bot stops replying to that user.

## Quality gates

| Gate | What |
|------|------|
| Lint | `npm run lint` |
| Types | `npx tsc --noEmit` |
| Unit | `npm test` |
| Build | `npm run build` |
| Migration smoke | `prisma migrate dev` against fresh DB |

CI must be green before merging to `main`. Production deploys run
`prisma:sync` automatically (gated by `VERCEL_ENV` in the build script).

## Coordination

- For new agent tool: write the tool in
  [`src/lib/ai/note-tools.ts`](../../../src/lib/ai/note-tools.ts), add
  the test alongside, document in
  [`knowledge/product-specs/note-agent.md`](../../../knowledge/product-specs/note-agent.md).
- For schema-touching changes: see
  [`engineer-data`](../engineer-data/SKILL.md) — every model change
  needs a migration smoke test.
- For new third-party integration: see
  [`engineer-integrations`](../engineer-integrations/SKILL.md) — mock
  the SDK in tests, verify graceful degradation.
