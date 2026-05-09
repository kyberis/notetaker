# ai-gateway-routing

## Problem

Will is a chat-first product, so cost / latency / model swapping are
operational concerns. We want:

- A single chokepoint for cost tracking and per-model retries.
- The ability to swap providers (OpenAI ↔ Anthropic ↔ Google) without
  touching feature code.
- A self-host story: `AI_GATEWAY_API_KEY`, `VERCEL_OIDC_TOKEN`, or legacy
  `OPENAI_API_KEY` resolve through [`gateway-auth.ts`](../../src/lib/ai/gateway-auth.ts).
- Voice and vision use the **same Gateway host** as chat (`OpenAI` SDK with
  `baseURL` set to `https://ai-gateway.vercel.sh/v1`).

## Decision

[`resolveGatewayApiKeyFromEnv`](../../src/lib/ai/gateway-auth.ts) supplies the bearer
token; all `OpenAI` SDK clients use **`baseURL: https://ai-gateway.vercel.sh/v1`**.
Chat continues to use `generateText({ model: gateway(...) })` from the AI SDK.

There is **no** remaining integration with `https://api.openai.com` in production code paths.

Routing matrix:

| Use case | Provider path | Where in code |
|----------|---------------|---------------|
| Chat / agent loop | `gateway(DEFAULT_MODEL)` | [`run-note-agent.ts`](../../src/lib/ai/run-note-agent.ts) |
| Whisper (audio → text) | OpenAI SDK → Gateway `/v1/audio/transcriptions` | [`transcribe.ts`](../../src/lib/ai/transcribe.ts) |
| Vision (image → text) | OpenAI SDK → Gateway `/v1/chat/completions` | [`extract.ts`](../../src/lib/ai/extract.ts) |
| TTS (text → audio) | OpenAI SDK → Gateway `/v1/audio/speech` | [`text-to-speech.ts`](../../src/lib/ai/text-to-speech.ts) |

The chat model defaults to `openai/gpt-4o-mini`, overridable per
environment via `AI_MODEL`. Models are **always** referenced as
`provider/model` strings so a swap is an env change, not a code change.

## Why this and not X

**Why not direct OpenAI for everything?** We lose Gateway's per-call
cost tracking, automatic retries, and the option to fail over to a
second model when one provider is degraded.

**Why route Whisper / vision / TTS through Gateway too?** Same bearer token and
outbound host as chat; models use `openai/<id>` IDs via `toGatewayModelId`.

**Why not abstract the provider behind our own interface?** The Vercel
AI SDK handles chat via `gateway(...)`. For audio and vision we configure the
official `OpenAI` SDK once with the Gateway `baseURL` instead of adding another wrapper.

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
the env. For chat use `generateText({ model: gateway(...) })`. For SDK-based
calls (`transcribe`, `extract`, `text-to-speech`), build the shared `OpenAI`
client with `baseURL` from [`gateway-auth.ts`](../../src/lib/ai/gateway-auth.ts)
and wrap bare model names with `toGatewayModelId(...)`.

When **adding a new audio / speech / vision call**:

- Extend [`gateway-auth.ts`](../../src/lib/ai/gateway-auth.ts) if auth resolution changes; keep **one** outbound AI host.

When **changing the default model**:

- Update `DEFAULT_MODEL` in
  [`src/lib/ai/run-note-agent.ts`](../../src/lib/ai/run-note-agent.ts).
- Bump the relevant CHANGELOG entry to mention the change (so users
  who self-host know to expect different behaviour).
- Verify cost in the Gateway dashboard for the new model before
  pushing.

## How to enforce it

- New chat code should use `gateway(...)` from the AI SDK. Any use of the
  `openai` npm package must set `baseURL` to the Gateway (see existing modules).
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
