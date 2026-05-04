# note-agent

> Chat-first AI agent that ingests text / voice / photo / PDF and turns
> it into a note (with optional tags and reminders) using a fixed
> tool set, in four languages, with live progress in Telegram.

## What it does

When a user sends Will a message:

1. The agent receives the user's text (already-transcribed for voice,
   already-extracted for photos and PDFs) plus a `source` enum.
2. The agent calls one or more **tools** to save the note, propose
   tags, schedule a reminder, edit / delete a previous note, search,
   or change the user's preferred language.
3. The agent replies with a short confirmation in the user's locale.

The user sees the bot "thinking → saving → tagging → scheduling" via a
status message that's edited in place as the agent's tool calls fire.

## Where the code lives

| Layer | Path |
|-------|------|
| Agent loop | [`src/lib/ai/run-note-agent.ts`](../../src/lib/ai/run-note-agent.ts) |
| Tool set | [`src/lib/ai/note-tools.ts`](../../src/lib/ai/note-tools.ts) |
| System prompts | [`src/lib/ai/prompts/{en,es,pt,ar}.ts`](../../src/lib/ai/prompts), resolver in [`prompts/index.ts`](../../src/lib/ai/prompts/index.ts) |
| Tool progress labels | [`src/lib/ai/tool-progress.ts`](../../src/lib/ai/tool-progress.ts) |
| Note persistence used by tools | [`src/lib/notes/persistence.ts`](../../src/lib/notes/persistence.ts) |
| Tag normalization | [`src/lib/notes/tags.ts`](../../src/lib/notes/tags.ts) |
| Reminder scheduling | [`src/lib/reminders/schedule.ts`](../../src/lib/reminders/schedule.ts) |
| Quota enforcement | [`src/lib/agent-quota.ts`](../../src/lib/agent-quota.ts) |
| Telegram entrypoint | [`src/app/api/webhooks/telegram/route.ts`](../../src/app/api/webhooks/telegram/route.ts) |
| Marketing copy (capabilities) | [`src/lib/marketing-content.ts`](../../src/lib/marketing-content.ts) (`FEATURES`, `LANDING_COPY`) |

## Data model

The agent itself is stateless per turn. It reads / writes:

- `Note` (created by `saveNote` tool).
- `Tag` + `NoteTag` (attached by `proposeTags`).
- `Reminder` (created by `setReminder`, 1:1 with `Note`).
- `User.locale` (mutated by `setUserLocale`).
- `AgentMessageUsage` (incremented on every turn by `consumeAgentQuota`,
  augmented with token counts via `recordAgentTokens`).

History within a single turn is the model's job. Across turns, we feed
the agent the user's **most recent 6 notes as a system summary** (no
prior agent replies are persisted in v1). See `loadHistory` in the
Telegram webhook.

## Contracts

### Inputs

`runNoteAgent({ userId, locale, source, messages, onStep? })`:

- `userId` — bound into every tool so the model can never write to
  another account.
- `locale` — resolves system prompt + RTL handling.
- `source` — `TELEGRAM_TEXT | TELEGRAM_VOICE | TELEGRAM_PHOTO |
  TELEGRAM_PDF | WEB`. Default for `saveNote` if the model omits it.
- `messages` — `ModelMessage[]` (system + user turns).
- `onStep(event)` — optional callback fired after each agent step with
  the tool names that ran. Errors thrown by `onStep` are caught and
  logged; the agent loop continues.

### Output

```ts
{ text: string; inputTokens?: number; outputTokens?: number }
```

The reply text is plain markdown (`**bold**`, `_italic_`, `` `code` ``)
which the Telegram bot converts to Telegram-flavoured HTML before
sending.

### Tools (input schemas)

| Name | Purpose | Side effects |
|------|---------|--------------|
| `saveNote` | First call when recording something. | Creates `Note`. Returns `{ id, occurredAt }`. |
| `proposeTags` | Apply 1-5 tags to a note saved this turn. | Creates `Tag` rows on demand, attaches `NoteTag`. |
| `setReminder` | Schedule a Telegram bell at a specific UTC datetime. | Creates `Reminder`. |
| `listRecentNotes` | Return the user's last N notes (default 10, max 20). | Read-only. |
| `searchNotes` | Free-text + optional tag filter. | Read-only. |
| `deleteNote` | Delete a note by id (`confirm: true` required). | Deletes `Note` + cascades. |
| `updateNote` | Edit body and/or tag set of an existing note. | Updates `Note`, replaces `NoteTag` set if provided. |
| `setUserLocale` | Persist preferred reply language (`en | es | pt | ar`). | Updates `User.locale`. |

Step budget: **6** (`stopWhen: stepCountIs(6)`). Temperature: **0.4**.
Default model: `openai/gpt-4o-mini`, override via `AI_MODEL` env. See
[`ai-gateway-routing`](../design-docs/ai-gateway-routing.md).

## Invariants

- **Tools are bound to a single user.** `buildNoteTools({ userId, ...
  })` closes over the id; the model literally cannot pass a different
  one.
- **Tool descriptions are English.** Per-locale prompts steer the
  reply language; tool selection is robust enough at GPT-4o-mini
  quality.
- **`onStep` errors are non-fatal.** Progress UI must never break the
  agent loop.
- **Quota is checked before the agent runs.** If `consumeAgentQuota`
  returns `ok: false`, the bot replies with the quota message and
  `runNoteAgent` is not called (saves cost, prevents the model
  acknowledging a request it can't fulfil).
- **Token usage is recorded after the agent returns.** `recordAgentTokens`
  augments `AgentMessageUsage.inputTokens` / `outputTokens`.
- **Tools never bypass `withApi()` shape.** Agent tools throw / return
  to the model, not to HTTP. The webhook is the only HTTP surface.
- **Soft-deleted users never reach this code.** The webhook drops them
  before the quota check.

## Known gaps / TODOs

- No per-tool authorisation beyond user binding. If we ever expose the
  agent over the per-user MCP (currently a reserved `ApiToken` model
  with no UI), tool-level scoping needs to land first.
- We don't persist agent replies in v1. "What did you say earlier?"
  questions are answered from recent notes summary only.
- `searchNotes` is a basic SQL `ILIKE` search today (see
  [`persistence.ts`](../../src/lib/notes/persistence.ts)). Vector /
  semantic search isn't implemented.
- The tool description strings are part of the model's prompt budget;
  we haven't tuned them for token economy.

## Related

- Design doc: [`ai-gateway-routing`](../design-docs/ai-gateway-routing.md)
- Design doc: [`multilingual-prompts`](../design-docs/multilingual-prompts.md)
- Skill: [`engineer-integrations`](../../.cursor/skills/engineer-integrations/SKILL.md)
  (AI section)
- Skill: [`automated-user-comms`](../../.cursor/skills/automated-user-comms/SKILL.md)
- Spec: [`telegram-bot`](telegram-bot.md)
- Spec: [`agent-quota`](agent-quota.md)
- Spec: [`reminders`](reminders.md)
