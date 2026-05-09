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
 * OCR / describe a Telegram photo. Returns the model's best plain-text
 * representation of what's in the image, normalised to a single paragraph
 * we can store as a note. Vision usage is gated by the user's quota.
 */
export async function extractFromImage(opts: { buffer: Buffer; mimeType?: string }): Promise<string | null> {
  const c = client();
  if (!c) return null;
  try {
    const dataUrl = `data:${opts.mimeType ?? "image/jpeg"};base64,${opts.buffer.toString("base64")}`;
    const res = await c.chat.completions.create({
      model: toGatewayModelId(process.env.AI_VISION_MODEL ?? "gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content:
            "You convert images into plain-text notes. Output only the text the user would want recorded. If the image is a screenshot of a message or document, transcribe it. If it is a scene, describe it in one sentence. No commentary, no markdown, no headings.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Convert this into a plain-text note." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      max_tokens: 600,
      temperature: 0.2,
    });
    const text = res.choices[0]?.message?.content;
    return typeof text === "string" ? text.trim() : null;
  } catch (err) {
    log.warn("vision_extract_failed", { error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}

/**
 * Extract text from a PDF buffer using pdf-parse v2. Returns the trimmed
 * text or null when extraction fails (e.g. scanned PDFs without OCR layer).
 */
export async function extractFromPdf(buffer: Buffer): Promise<string | null> {
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    const text = result.text?.trim();
    if (!text) return null;
    return text.length > 8000 ? text.slice(0, 8000) + "…" : text;
  } catch (err) {
    log.warn("pdf_extract_failed", { error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}
