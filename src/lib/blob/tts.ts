import { put } from "@vercel/blob";

import { log } from "@/lib/log";

/**
 * Upload a TTS audio buffer to Vercel Blob and return the public URL.
 * Returns null when the BLOB token isn't configured (so TTS becomes a
 * silent no-op in dev / self-host without Blob).
 */
export async function uploadTtsToBlob(buffer: Buffer, key: string): Promise<string | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const result = await put(key, buffer, {
      access: "public",
      contentType: "audio/ogg",
      addRandomSuffix: false,
    });
    return result.url;
  } catch (err) {
    log.warn("blob_tts_upload_failed", { error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}
