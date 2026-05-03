# AGENTS.md — table of contents for agents

This file is intentionally short — a **map**, not an encyclopedia.

> **Golden rule:** the repo is the system of record. Push context into the
> repo, not chat threads.

## Product in one line

**Will** (repo `notetaker`) is a Telegram-first, open-source (MIT),
self-hostable note-taking AI assistant. Tell Will what you will via Telegram
(text / voice / photo / PDF), Will saves it, suggests tags, and pings you
back when a reminder is due.

## Where to look first

1. [`README.md`](README.md) — quick start, tech stack, deploy.
2. [`prisma/schema.prisma`](prisma/schema.prisma) — full data model.
3. [`src/lib/ai/run-note-agent.ts`](src/lib/ai/run-note-agent.ts) — agent loop.
4. [`src/lib/ai/note-tools.ts`](src/lib/ai/note-tools.ts) — agent tools.
5. [`src/app/api/webhooks/telegram/route.ts`](src/app/api/webhooks/telegram/route.ts) — Telegram entrypoint.
6. [`src/app/api/cron/reminders/route.ts`](src/app/api/cron/reminders/route.ts) — reminder dispatcher.
7. [`src/lib/marketing-content.ts`](src/lib/marketing-content.ts) — landing copy + CHANGELOG (single source).

## Operating principles

- **Telegram-first.** Every new capability should be reachable from chat
  before it gets a web UI.
- **Web UI is English-only.** Multilingual support is for the agent
  (en / es / pt / ar). Adding a new language = adding a dictionary file.
- **Errors flow through `withApi()`.** Route handlers stay tiny.
- **AI uses the Vercel AI Gateway** when `AI_GATEWAY_API_KEY` /
  `VERCEL_OIDC_TOKEN` is set, falling back to direct OpenAI for chat too.
  Whisper + TTS always hit OpenAI directly.
- **Self-hostable by default.** Optional integrations (Telegram, Resend,
  Upstash, Blob, Turnstile) must degrade gracefully when env is missing.
- **Changelog goes in [`src/lib/marketing-content.ts`](src/lib/marketing-content.ts).** Never duplicate.

## Sister project

- **Clara** ([github.com/kyberis/etracker](https://github.com/kyberis/etracker))
  is a chat-first personal-finance assistant by the same maintainer. Will
  and Clara share design patterns but ship from independent repos. Both are
  embedded as pinned submodules in [`trefolio`](https://github.com/kyberis/stocktracker).

If this map is ever wrong, fix it. The map is part of the code.
