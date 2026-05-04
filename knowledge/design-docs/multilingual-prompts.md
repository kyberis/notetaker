# multilingual-prompts

## Problem

The agent must speak four languages (en / es / pt / ar) **with one tool
set**. Translating tool descriptions per-language would be a maintenance
nightmare and would create subtle behavioural drift between locales.
Hardcoding language switches inside a single prompt would bloat tokens
and confuse the model.

The user-facing dictionary (templated bot strings — "linked", "quota
exceeded", "voice too long") has the same constraint: parallel files
that must stay in lockstep with each other and with whatever the agent
says in free prose.

## Decision

We use **two parallel folders**, one per concern, with one file per
locale and a small `index.ts` resolver:

| Concern | Folder | Files |
|---------|--------|-------|
| Agent system prompts | [`src/lib/ai/prompts/`](../../src/lib/ai/prompts) | `en.ts`, `es.ts`, `pt.ts`, `ar.ts`, `index.ts` |
| Bot templated strings | [`src/lib/i18n/dictionaries/`](../../src/lib/i18n/dictionaries) | one file per locale, accessed via `dict(locale).bot.<key>` |

The agent loop reads the user's `User.locale` (defaulting to `en`),
selects the matching system prompt via `buildSystemPrompt({ locale,
nowUtc })`, and feeds it to the model. Tool descriptions stay in
English (the model handles cross-language tool selection well at
GPT-4o-mini quality).

Locale primitives live in
[`src/lib/i18n/locale.ts`](../../src/lib/i18n/locale.ts):

- `LOCALES = ["en", "es", "pt", "ar"]`
- `DEFAULT_LOCALE = "en"`
- `isLocale(value)` type guard.
- `normalizeLocale(value)` collapses BCP-47 tags to our supported set.
- `pickFromAcceptLanguage(header)` for first-page resolution.
- `isRtl(locale)` — currently `true` only for `ar`.

Resolution order:

1. Authenticated `User.locale`.
2. `NEXT_LOCALE` cookie.
3. `Accept-Language` request header.
4. Fallback: `en`.

## Why this and not X

**Why not store prompts in the DB?** Prompts are code — they need
review, version control, and the same CI gates as tool implementations.
Storing them in the DB invites silent drift between environments.

**Why not a single prompt with `{LOCALE}` variable?** The model will
mix languages in its reply (tested, observed). Keeping per-locale
prompts gives the model an unambiguous voice contract.

**Why English-only tool descriptions?** Two reasons:
1. Tool descriptions are part of the model's reasoning context, not the
   user's. Translating them buys nothing and risks subtle semantic
   drift.
2. The Vercel AI SDK doesn't have a built-in "tool description per
   model language" feature; building one adds complexity for no user
   benefit.

**Why not just use Next.js i18n routing?** Will's web is English-only
by design. The multilingual surface is the agent + the bot, which
don't touch the URL.

## How to follow it

When **adding a new bot string** (templated, sent by code rather than
the agent):

1. Add the key to **all four** dictionary files in
   `src/lib/i18n/dictionaries/`.
2. Access via `dict(locale).bot.<newKey>`. Locale comes from `User.locale`
   in async / cron paths, never from the request.
3. If the string takes parameters, make it a function (e.g.
   `quotaExceeded: (limit: number) => "..."`).

When **changing the agent's behaviour via prompt**:

1. Edit **all four** prompt files. Keep the rules in lockstep:
   - "Use the tools, don't just describe what you would do."
   - "Ask before scheduling a reminder."
   - "Will doesn't give advice."
2. Bump the relevant CHANGELOG entry only if the change is
   user-visible (e.g. tone, new capability), not for internal fixes.
3. Smoke-test in Telegram in each locale.

When **adding a fifth language** (e.g. French):

1. Add `"fr"` to `LOCALES` in `src/lib/i18n/locale.ts`.
2. Add `fr` cases to `normalizeLocale`, `pickFromAcceptLanguage`,
   `toBcp47`, `LOCALE_LABELS`, and `isRtl`.
3. Create `src/lib/i18n/dictionaries/fr.ts` mirroring the EN keys.
4. Create `src/lib/ai/prompts/fr.ts` mirroring the EN prompt.
5. Add the import + branch to `buildSystemPrompt` in
   `src/lib/ai/prompts/index.ts`.
6. Add the import + branch to the `dict()` function in
   `src/lib/i18n/index.ts`.
7. Add a CHANGELOG entry: "Will now answers in French."
8. Smoke-test in Telegram by setting `User.locale = "fr"`.

## How to enforce it

- A typecheck via `Locale` union prevents a stray locale from being
  accepted at API boundaries (any handler that takes a locale string
  must `isLocale()`-check before passing it on).
- Dictionary tests (when added) should assert all four files export
  the same key set — drift is the most common bug.
- Code review: any string sent to the user that lives in TSX is a
  smell. It belongs in a dictionary.

## Open questions

- We don't yet have an automated "key parity" test across the four
  dictionaries. Adding one would catch the worst class of drift.
- Spanish, Portuguese, and Arabic prompts are written from the EN
  prompt by the maintainer; native-speaker review would tighten them.
- Right-to-left UI for Arabic isn't a concern in v1 because the web is
  English-only. If we ever localise the web, `isRtl()` flips
  `<html dir="rtl">`.
