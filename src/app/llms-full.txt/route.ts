import { NextResponse } from "next/server";

import { renderLlmsFull } from "@/lib/llms-content";

/**
 * `/llms-full.txt` — verbose single-file dump of the marketing copy.
 * Helpful for answer engines (Perplexity, ChatGPT, Claude) that prefer to
 * cite a single canonical document.
 */
export function GET() {
  return new NextResponse(renderLlmsFull(), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
}

export const dynamic = "force-static";
