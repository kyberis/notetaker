# ai-gateway-routing

## Problem

Will is a chat-first product, so cost / latency / model swapping are
operational concerns. We want:

- A single chokepoint for cost tracking and per-model retries.
- The ability to swap providers (OpenAI ↔ Anthropic ↔ Google) without
  touching feature code.
- A self-host story: a developer with only an `OPENAI_API_KEY` should
  get a working agent without signing up for the Vercel AI Gateway.
- Voice and audio features (Whisper STT, TTS) that work even when the
  Gateway can't proxy them.

## Decision

The agent loop calls **Vercel AI Gateway** when an `AI_GATEWAY_API_KEY`
or `VERCEL_OIDC_TOKEN` is set, and falls back to direct OpenAI
otherwise. **Whisper, vision, and TTS always hit OpenAI directly**
(those endpoints are not proxied by the Gateway today).

Routing matrix:

| Use case | Provider | Where in code |
|----------|----------|---------------|
| Chat / agent loop | AI Gateway when configured, else direct OpenAI | [`src/lib/ai/run-note-agent.ts`](../../src/lib/ai/run-note-agent.ts) — `gateway(DEFAULT_MODEL)` |
| Whisper (audio → text) | Direct OpenAI only | [`src/lib/ai/transcribe.ts`](../../src/lib/ai/transcribe.ts) |
| Vision (image → text) | Direct OpenAI (chat completions with `image_url`) | [`src/lib/ai/extract.ts`](../../src/lib/ai/extract.ts) |
| TTS (text → audio) | Direct OpenAI only | [`src/lib/ai/text-to-speech.ts`](../../src/lib/ai/text-to-speech.ts) |

The chat model defaults to `openai/gpt-4o-mini`, overridable per
environment via `AI_MODEL`. Models are **always** referenced as
`provider/model` strings so a swap is an env change, not a code change.

## Why this and not X

**Why not direct OpenAI for everything?** We lose Gateway's per-call
cost tracking, automatic retries, and the option to fail over to a
second model when one provider is degraded.

**Why not "always Gateway"?** Whisper / TTS are not Gateway-proxied at
the time of writing. Forcing Gateway here would silently break the
voice features. Also: a self-host story without the Gateway is core to
the MIT positioning.

**Why not abstract the provider behind our own interface?** The Vercel
AI SDK already does this. Wrapping the wrap is overhead. The agent
loop calls `generateText({ model: gateway(...) })` — when the Gateway
token is missing, the SDK transparently uses direct OpenAI. We get the
fallback for free.

**Why pin the default to `gpt-4o-mini`?** Cost and latency. The agent
runs up to 6 tool-calling steps per turn; mini is the right default for
that volume. Heavier reasoning can opt into a better model via
`AI_MODEL` per deployment.

## How to follow it

When **adding a new chat / classification call**:

```ts
import { generateText, gateway } from "ai";

const result = await generateText({
  model: gateway(process.env.AI_MODEL ?? "openai/gpt-4o-mini"),
  system: "...",
  messages: [...],
});
```

Never hardcode an absolute model in feature code — pass it in or read
the env. Never call `new OpenAI(...)` directly for chat — use
`generateText({ model: gateway(...) })`.

When **adding a new audio / speech / vision call**:

- Call OpenAI directly with the official client. Document in the
  feature's spec that this is intentionally not Gateway-routed.

When **changing the default model**:

- Update `DEFAULT_MODEL` in
  [`src/lib/ai/run-note-agent.ts`](../../src/lib/ai/run-note-agent.ts).
- Bump the relevant CHANGELOG entry to mention the change (so users
  who self-host know to expect different behaviour).
- Verify cost in the Gateway dashboard for the new model before
  pushing.

## How to enforce it

- New code that imports `openai` directly for chat (not Whisper / TTS
  / vision) should be flagged in code review.
- Tests for agent / classification helpers should mock `generateText`
  at the module boundary (not the `openai` client) so the abstraction
  stays.

## Open questions

- We don't yet expose per-user model choice. If a Pro tier ever ships,
  add a `User.aiModel` column and let it override the env default.
- The Gateway also supports image generation; we don't use it yet.
  When we do, route through the Gateway by default.
- Cost tracking via Gateway is per-deployment, not per-user. If we
  need per-user attribution, supplement with our own `inputTokens` /
  `outputTokens` rollup in `AgentMessageUsage`.
