# Contributing to Will

Thanks for considering a contribution. Will is small on purpose; I'd rather
say "no" to a sprawling PR than merge code that bloats the surface.

## Before you start

- Open an issue first for anything bigger than a typo or a clear bug fix.
  I'll tell you whether it fits the roadmap before you spend time on it.
- Read [`AGENTS.md`](./AGENTS.md) and the **Operating principles** section.
- Run `npm run lint && npx tsc --noEmit && npm test && npm run build`
  before submitting.

## What I'm looking for

- New language packs (`src/lib/i18n/dictionaries/<locale>.ts`) — please copy
  the English file and translate; native speakers preferred.
- New broker / source integrations? **No.** Will is notes only — that's the
  scope.
- Better Telegram UX (inline buttons, voice ergonomics) — yes please.
- Tests for the agent loop and the reminder dispatcher.

## What I'm not looking for

- Drive-by refactors that touch a hundred files.
- Adding heavy dependencies (Redux, ORMs other than Prisma, etc.).
- "AI-generated" PRs without human review.

## Code style

- TypeScript strict. ESLint + Prettier configured.
- Tests with Vitest. Co-locate them next to the file under test.
- No comments that just narrate code. Comments explain *why*.

## Licence

By contributing you agree to license your work under the MIT licence in
[`LICENSE`](./LICENSE).
