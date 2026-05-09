import { NextResponse } from "next/server";

import { getSiteUrl } from "@/lib/seo";

export async function GET() {
  const site = getSiteUrl();
  const body = {
    name: "Will",
    description: "Telegram-first note-taking AI (trefolio ecosystem).",
    homepage: site,
    documentation: `${site}/llms-full.txt`,
    contact: {
      name: "Trefolio",
      url: "https://trefolio.com",
    },
    servers: [
      {
        id: "will-user",
        name: "Will (per user)",
        description:
          "Read your Will notes via MCP. Bearer token `tfp_pat_…` from user.trefolio.com → Developer.",
        url: `${site}/api/mcp/user`,
        transport: "http",
        protocol: "modelcontextprotocol",
        version: "2025-06-18",
        authentication: {
          type: "bearer",
          token_format: "tfp_pat_<64-hex>",
          documentation: "https://user.trefolio.com/account/developer",
        },
        capabilities: {
          tools: true,
          resources: false,
          prompts: false,
        },
      },
    ],
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
}

export const dynamic = "force-static";
