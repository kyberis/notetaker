import { NextResponse } from "next/server";

import { renderLlmsIndex } from "@/lib/llms-content";

/**
 * `/llms.txt` — structured pointer index per https://llmstxt.org so LLMs and
 * AI agents can discover Will's documentation surface in one fetch.
 *
 * The verbose, single-file dump of the marketing copy lives at
 * `/llms-full.txt`.
 */
export function GET() {
  return new NextResponse(renderLlmsIndex(), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
}

export const dynamic = "force-static";
