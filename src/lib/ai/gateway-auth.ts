/**
 * Vercel AI Gateway for OpenAI-compatible clients (chat, audio, vision).
 * @see https://vercel.com/docs/ai-gateway
 */

export const VERCEL_AI_GATEWAY_BASE = "https://ai-gateway.vercel.sh/v1";

export function toGatewayModelId(model: string): string {
  const t = model.trim();
  if (!t) return "openai/gpt-4o-mini";
  if (t.includes("/")) return t;
  return `openai/${t}`;
}

export function resolveGatewayApiKeyFromEnv(): string | null {
  return (
    process.env.AI_GATEWAY_API_KEY?.trim() ||
    process.env.VERCEL_OIDC_TOKEN?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    null
  );
}
