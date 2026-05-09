<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — table of contents for agents

This file is intentionally short — a **map**, not an encyclopedia. Its job is
to tell an agent where to look next.

> **Golden rule:** the repo is the system of record. Anything not discoverable
> from this repo effectively does not exist. Push context into the repo —
> not chat threads, not your head.

## Product in one line

**Will** (repo `notetaker`) is a Telegram-first, open-source (MIT),
self-hostable note-taking AI assistant. Tell Will what you will via Telegram
(text / voice / photo / PDF), Will saves it, suggests tags, and pings you
back when a reminder is due.

## Where to look first

1. [`README.md`](README.md) — public-facing description, tech stack, quick start.
2. [`knowledge/design-docs/index.md`](knowledge/design-docs/index.md) — core
   beliefs and cross-cutting patterns (Telegram-first, AI Gateway routing,
   `withApi()` error handling, multilingual prompts, deep-link tokens).
3. [`knowledge/product-specs/index.md`](knowledge/product-specs/index.md) —
   one spec per user-visible feature.
4. [`knowledge/exec-plans/active/`](knowledge/exec-plans/active) — in-flight
   multi-step plans (move to `completed/` when shipped).
5. [`prisma/schema.prisma`](prisma/schema.prisma) — full data model
   (intentionally small: notes + tags + reminders is the whole product).
6. [`src/lib/ai/run-note-agent.ts`](src/lib/ai/run-note-agent.ts) +
   [`src/lib/ai/note-tools.ts`](src/lib/ai/note-tools.ts) — agent loop and
   the seven tools the model can call.
7. [`src/app/api/webhooks/telegram/route.ts`](src/app/api/webhooks/telegram/route.ts) —
   Telegram entrypoint (text / voice / photo / PDF, status messages, TTS).
8. [`src/app/api/cron/reminders/route.ts`](src/app/api/cron/reminders/route.ts) —
   reminder dispatcher (1-minute cron).
9. [`src/lib/marketing-content.ts`](src/lib/marketing-content.ts) — landing
   copy + `CHANGELOG` (single source of truth for both).

## Repository layout (high level)

```
src/
  app/
    (auth)/          Login / register / passkey / accept-terms
    (authed)/        Authenticated web app (read-only journal + admin + settings)
    (marketing)/     Public landing, FAQ, changelog, privacy
    api/             REST handlers — every one wrapped in withApi()
      cron/          reminders (every min), account-purge (daily), deletion-reminders (daily)
      webhooks/      Telegram bot webhook
      account/       export, delete, accept-terms
      notes/         Read-only list of own notes for the web journal
      admin/         Admin-only user management
    sitemap.ts robots.ts manifest.ts opengraph-image.tsx llms.txt llms-full.txt
  components/        React components (web journal + marketing)
  lib/
    ai/              Agent loop, tools, prompts (en/es/pt/ar), Whisper, TTS, vision/PDF extract
    auth/            NextAuth + sessions + cron secret verifier
    blob/            Vercel Blob upload helpers (TTS audio)
    i18n/            Locale primitives + per-locale dictionaries for the bot
    mail/            Resend client + verification email
    notes/           Persistence + tags normalization + day buckets for the journal
    reminders/       schedule() + dispatch() (cron)
    telegram/        Bot API client + deep-link code + Markdown→HTML formatter
    http.ts          withApi() wrapper used by every route handler
    log.ts           Structured logging
    db.ts            Prisma client singleton
    legal.ts         CURRENT_TERMS_VERSION + ACCOUNT_DELETION_GRACE_DAYS
    agent-quota.ts   Daily message quota (web + Telegram combined)
    rate-limit.ts    Upstash-backed rate limiting (degrades gracefully)
    marketing-content.ts  Landing copy + CHANGELOG (single source of truth)
  proxy.ts           Next.js middleware (auth, security headers)
prisma/              Schema + migrations (PostgreSQL)
public/              Static assets (icons, manifests, og images)
scripts/             One-off scripts (telegram:webhook, prisma:sync, …)
.github/workflows/   CI (lint, typecheck, test, build)
knowledge/           Agent knowledge base (this is the system of record)
.cursor/
  rules/             Always-applied rules
  skills/            Expert skills by domain
```

## Operating principles (summary)

- **Telegram-first.** Every new capability should be reachable from chat
  before it gets a web UI. The web is read-only by design today.
- **Web UI is English-only.** Multilingual support is for the agent
  (en / es / pt / ar). Adding a new language = adding a dictionary file in
  [`src/lib/i18n/dictionaries/`](src/lib/i18n/dictionaries) and a system prompt
  in [`src/lib/ai/prompts/`](src/lib/ai/prompts).
- **Errors flow through `withApi()`.** Route handlers stay tiny; mapping Zod
  / business errors to HTTP shapes is centralised in
  [`src/lib/http.ts`](src/lib/http.ts). Never `try/catch + rethrow` in
  handlers.
- **AI uses the Vercel AI Gateway** for chat (`gateway(...)`) and for Whisper,
  vision, and TTS via the OpenAI SDK with `baseURL` set to the Gateway. Env resolution:
  `AI_GATEWAY_API_KEY` → `VERCEL_OIDC_TOKEN` → `OPENAI_API_KEY`.
- **Self-hostable by default.** Optional integrations (Telegram, Resend,
  Upstash, Blob, Turnstile, AI Gateway) must degrade gracefully when env
  vars are missing.
- **CHANGELOG goes in [`src/lib/marketing-content.ts`](src/lib/marketing-content.ts).**
  Never duplicate. See [`.cursor/rules/changelog.mdc`](.cursor/rules/changelog.mdc).
- **Voice: lightly bardic.** "Will" is a Twelfth Night wink. Marketing copy
  plays with that conceit (Folio typography, Renaissance flourishes); bot
  replies stay short and useful — never pastiche. See
  [`.cursor/skills/ux-writer/SKILL.md`](.cursor/skills/ux-writer/SKILL.md).

## Operating process

- Plans for non-trivial work go under
  [`knowledge/exec-plans/active/`](knowledge/exec-plans/active). Move to
  `completed/` when done.
- New features get a short product spec in
  [`knowledge/product-specs/`](knowledge/product-specs) using
  [`knowledge/templates/product-spec.template.md`](knowledge/templates/product-spec.template.md),
  and an entry in the index. **This is mandatory** — see
  [`.cursor/rules/knowledge-base.mdc`](.cursor/rules/knowledge-base.mdc).
- Cross-cutting decisions (AI prompts, auth, multi-step pipelines) get a
  design doc in [`knowledge/design-docs/`](knowledge/design-docs).

## Git discipline

- Bypass corporate hooks + GPG signing: `git -c commit.gpgsign=false commit
  --no-verify -m "..."` and `git push --no-verify origin <branch>`. See
  [`.cursor/rules/git-push.mdc`](.cursor/rules/git-push.mdc).
- `origin/main` on https://github.com/kyberis/notetaker is wired to Vercel:
  pushing to `main` triggers a production deploy that runs `prisma migrate
  deploy` (gated by `VERCEL_ENV` in the build script). Run
  `npm run lint && npx tsc --noEmit && npm test && npm run build` before
  pushing.

## Sister projects

- **Clara** ([github.com/kyberis/etracker](https://github.com/kyberis/etracker))
  — chat-first personal-finance assistant by the same maintainer. Will and
  Clara share design patterns (`withApi()`, AI Gateway routing, marketing
  content as source) but ship from independent repos.
- **trefolio** ([github.com/kyberis/stocktracker](https://github.com/kyberis/stocktracker))
  — European multi-currency portfolio tracker. Both Will and Clara are
  embedded as pinned git submodules in trefolio for context. Trefolio never
  builds either.

If this map is ever wrong, fix it. The map is part of the code.
