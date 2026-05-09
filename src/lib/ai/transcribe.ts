import OpenAI from "openai";

import { log } from "@/lib/log";
import { resolveGatewayApiKeyFromEnv, VERCEL_AI_GATEWAY_BASE, toGatewayModelId } from "@/lib/ai/gateway-auth";

let cachedClient: OpenAI | null = null;

function client(): OpenAI | null {
  if (cachedClient) return cachedClient;
  const apiKey = resolveGatewayApiKeyFromEnv();
  if (!apiKey) return null;
  cachedClient = new OpenAI({ apiKey, baseURL: VERCEL_AI_GATEWAY_BASE });
  return cachedClient;
}

/**
 * Transcribe a Telegram voice note (Opus / OGG). Whisper handles the codec
 * directly. Returns null when the API key is missing or the call fails so
 * the webhook can fall back to a polite error.
 */
export async function transcribeAudio(opts: {
  buffer: Buffer;
  filename?: string;
  /** ISO 639-1 language hint to nudge Whisper into the right script. */
  languageHint?: string;
}): Promise<string | null> {
  const c = client();
  if (!c) return null;

  try {
    const blob = new Blob([new Uint8Array(opts.buffer)], { type: "audio/ogg" });
    const file = new File([blob], opts.filename ?? "voice.ogg", { type: "audio/ogg" });
    const res = await c.audio.transcriptions.create({
      file,
      model: toGatewayModelId("whisper-1"),
      language: opts.languageHint,
    });
    return res.text;
  } catch (err) {
    log.warn("transcribe_failed", { error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}
