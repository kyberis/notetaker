/**
 * Vercel AI Gateway for OpenAI-compatible clients (Whisper, vision, TTS).
 *
 * The resolution rules now live in `@kyberis/agent-os/runtime` so Will, Clara
 * and Warren agree on which env var wins. Will's chain is the default one:
 * `AI_GATEWAY_API_KEY` → `VERCEL_OIDC_TOKEN` → `OPENAI_API_KEY`.
 *
 * @see https://vercel.com/docs/ai-gateway
 */

import {
  resolveGatewayApiKeySync,
  toGatewayModelId,
  VERCEL_AI_GATEWAY_BASE,
} from "@kyberis/agent-os/runtime";

export { toGatewayModelId, VERCEL_AI_GATEWAY_BASE };

export function resolveGatewayApiKeyFromEnv(): string | null {
  return resolveGatewayApiKeySync();
}
