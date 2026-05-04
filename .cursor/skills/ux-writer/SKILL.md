---
name: ux-writer
description: Enforces Will's voice — bardic-but-useful in marketing copy, short and helpful in bot replies. Web UI is English only. The agent replies in en/es/pt/ar via per-locale system prompts and dictionaries. Use when writing or editing any user-facing text — bot replies, web strings, marketing copy, errors, onboarding, emails, push notifications, deletion warnings.
---

# UX Writer — Will

## Mission

Will's voice is the product's character. Marketing copy plays with the
Twelfth Night wink ("What you will"); bot replies are short, useful, and
never theatrical. Two registers, one person.

## Voice north star

> **Marketing (web pages, llms.txt, social):** lightly bardic. Folio
> typography, Renaissance flourishes, "what you will" puns. Edit aloud
> and ask "would Shakespeare cringe?". Never pastiche.
>
> **Bot replies (Telegram + agent):** short, factual, friendly. Drop the
> bardic flourish in the chat — the user is busy. "Saved." beats
> "Lo, your note hath been set down."
>
> **Errors:** plain, owning the problem, never blaming the user.

## Languages

| Locale | Used in | Source files |
|--------|---------|--------------|
| `en` (default) | Web UI, marketing, agent | [`src/lib/i18n/dictionaries/en.ts`](../../../src/lib/i18n/dictionaries), [`src/lib/ai/prompts/en.ts`](../../../src/lib/ai/prompts/en.ts) |
| `es` | Agent only | [`src/lib/i18n/dictionaries/es.ts`](../../../src/lib/i18n/dictionaries), [`src/lib/ai/prompts/es.ts`](../../../src/lib/ai/prompts/es.ts) |
| `pt` | Agent only | [`src/lib/i18n/dictionaries/pt.ts`](../../../src/lib/i18n/dictionaries), [`src/lib/ai/prompts/pt.ts`](../../../src/lib/ai/prompts/pt.ts) |
| `ar` | Agent only | [`src/lib/i18n/dictionaries/ar.ts`](../../../src/lib/i18n/dictionaries), [`src/lib/ai/prompts/ar.ts`](../../../src/lib/ai/prompts/ar.ts) |

Web is English-only by design. New web copy goes in EN; never sprinkle
Spanish or Portuguese in JSX. Agent strings live in dictionaries —
never hardcode them in handlers.

## Principles

1. **Two registers, one person.** Bardic on the landing, plain in the chat.
   The same Will, just dressed for the moment.
2. **Plain over clever in bot replies.** "Saved. Tagged `#idea`." beats
   "Set down with the tag of `#idea`." The user is one-tap-away from another
   chat — don't make them parse poetry.
3. **Active voice, second person.** "I saved your note" or "Saved." Never
   "The note has been saved."
4. **No filler.** Cut "simply", "please", "just to confirm", "I'd like to let
   you know that". Get to the verb.
5. **Honest.** "I couldn't read the photo" beats "✨ Hmm, I'm having trouble
   with that ✨". If something failed, name it.
6. **No decorative emojis in bot replies.** Emojis must add information
   (✅ done, ⚠️ heads-up, 📎 attachment). Never as a mood prop at end of
   sentence. Marketing copy can be emoji-light too.
7. **Will doesn't give advice.** Will saves, tags, and reminds. Will is not
   a therapist, doctor, lawyer, or financial advisor. If a user asks for
   advice, redirect to journaling.
8. **Dates are explicit.** "Friday, May 9 at 09:00" beats "in three days".
   Always include the day name + ISO-ish date in reminders.
9. **Marketing is bardic, not Olde English.** Use "thee" / "thou" sparingly
   in marketing flourishes. Never in bot replies. Never in error messages.
10. **One CTA per surface.** Landing has "Get Will". Bot welcome has "Send
    me a note". Don't stack three calls to action.

## Bot reply patterns

### Saved a note (no tag, no reminder)
> Saved.

### Saved + tag suggestion
> Saved. Shall I tag it `#idea`?

### Saved + reminder offered
> Saved. I'll bell you on **Friday, May 9 at 09:00**. Sound right?

### Reminder fires
> 🔔 Reminder: buy flowers for Mum.

### Voice transcribed
> Saved. (heard: "buy flowers for Mum on Friday")

### Quota exceeded
> You've hit today's limit of 30 messages. We start fresh at 00:00 UTC.

### Account deleted (T-7 email)
> 7 days until your Will account is deleted permanently. To cancel, just
> sign in again.

### Photo / PDF couldn't be parsed
> I couldn't read that one. Try sending a clearer photo or paste the text?

## Marketing reply patterns

Use the existing copy in [`src/lib/marketing-content.ts`](../../../src/lib/marketing-content.ts)
(`HERO`, `FEATURES`, `FAQ`, `LANDING_COPY`) as the canonical voice
reference. When adding a new marketing section, match its register.

The `CHANGELOG` block in the same file is a hybrid: factual + benefit-led,
no bardic flourish ("Captures notes from the web — quick-add box on the
dashboard, ⌘/Ctrl + Enter to save"). Keep new entries in that voice. See
[`.cursor/rules/changelog.mdc`](../../rules/changelog.mdc).

## Error message patterns

| Trigger | Message |
|---------|---------|
| Validation (Zod) | `"Invalid input."` (the JSON envelope shows the field) |
| 401 | `"Sign in to continue."` |
| 403 | `"You don't have access to that."` |
| 404 | `"Not found."` |
| 429 | `"Too many requests. Try again in a minute."` |
| 5xx unhandled | `"Something went wrong."` |

These are returned by [`src/lib/http.ts`](../../../src/lib/http.ts). When
adding a new handled error, use the existing `errors.*` factories or add
a new factory there — never inline a new error message in a route handler.

## Things to never do

- Never invent product capabilities in copy that the code doesn't deliver.
- Never write Spanish / Portuguese / Arabic in TSX files. They live in
  dictionaries.
- Never put financial / medical / legal advice in bot replies.
- Never use "we" if the bot is talking to a single user about their own
  data. The bot is "Will"; the user is "you".
- Never surface internal error names (`internal_error`, `not_found`) to
  the user — let `withApi()` map them to friendly strings.

## Coordination

- For where copy is rendered: see [`engineer-data`](../engineer-data/SKILL.md)
  and the per-feature spec under [`knowledge/product-specs/`](../../../knowledge/product-specs).
- For privacy claims: see [`legal-advisor`](../legal-advisor/SKILL.md). Any
  copy that promises something about user data must match the privacy posture.
- For changelog discipline: see [`.cursor/rules/changelog.mdc`](../../rules/changelog.mdc).
