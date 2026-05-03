import OpenAI from "openai";

import { log } from "@/lib/log";

let cachedClient: OpenAI | null = null;

function client(): OpenAI | null {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}

export async function textToSpeech(text: string): Promise<Buffer | null> {
  const c = client();
  if (!c) return null;
  try {
    const res = await c.audio.speech.create({
      model: process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts",
      voice: (process.env.OPENAI_TTS_VOICE ?? "nova") as "nova",
      input: text,
      response_format: "opus",
    });
    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    log.warn("tts_failed", { error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}
