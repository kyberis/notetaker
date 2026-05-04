# Design docs index

Design docs capture cross-cutting decisions that aren't obvious from the
code. They explain **why** the code is shaped the way it is, so the next
agent doesn't undo a deliberate choice by accident.

## Live docs

- [`core-beliefs`](core-beliefs.md) — the non-negotiables (Telegram-first,
  web read-only, multilingual agent, errors via `withApi()`, AI Gateway
  routing, privacy posture, MIT + self-hostable).
- [`with-api-error-handling`](with-api-error-handling.md) — why every
  route handler is wrapped in `withApi()`, how Zod / Prisma / business
  errors map to HTTP responses, what NOT to do.
- [`ai-gateway-routing`](ai-gateway-routing.md) — when chat goes through
  Vercel AI Gateway vs direct OpenAI, why Whisper / vision / TTS always
  hit OpenAI directly, how `AI_MODEL` overrides work.
- [`telegram-deep-link-tokens`](telegram-deep-link-tokens.md) — why we
  use a 16-char DB-backed code for `/start <code>` instead of signed
  JWTs (Telegram's 64-char `start` cap), TTL, threat model.
- [`multilingual-prompts`](multilingual-prompts.md) — how the agent
  speaks four languages with one tool set, the dictionary +
  system-prompt structure, how to add a fifth language.

## Suggested next docs (write when you touch them)

- `marketing-content-as-source.md` — why landing / FAQ / changelog all
  live in `src/lib/marketing-content.ts` and not in MD or CMS.
- `account-lifecycle.md` — full state machine for signup → verify →
  consent → soft-delete → grace → purge / restore.
- `telegram-status-message.md` — the live "thinking → saving →
  tagging" pattern that edits a message in place during the agent run.

Add new docs by copying
[`../templates/design-doc.template.md`](../templates/design-doc.template.md)
and linking them above.
