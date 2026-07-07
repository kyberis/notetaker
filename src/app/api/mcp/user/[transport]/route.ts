import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { NextResponse } from "next/server";

import { authenticateWillMcpRequest, verifyWillMcpBearer } from "@/lib/mcp/will-pat-auth";
import { LEGACY_WILL_MCP_SCOPES } from "@/lib/mcp/pat-scopes";
import { registerWillUserMcp } from "@/lib/mcp/user-server";
import { buildRateLimiter, enforceLimit } from "@/lib/rate-limit";

const PRODUCT_VERSION = "0.1.0";

const userLimiter = buildRateLimiter({
  prefix: "will.mcp.user",
  limit: 240,
  windowSeconds: 60,
});
const unauthLimiter = buildRateLimiter({
  prefix: "will.mcp.user.unauth",
  limit: 60,
  windowSeconds: 60,
});

const baseHandler = createMcpHandler(
  (server) => {
    registerWillUserMcp(server);
  },
  {
    serverInfo: {
      name: "will-user",
      version: PRODUCT_VERSION,
    },
  },
  {
    basePath: "/api/mcp",
    maxDuration: 60,
    verboseLogs: process.env.NODE_ENV !== "production",
  },
);

const authenticatedHandler = withMcpAuth(
  baseHandler,
  async (_req, bearer) => {
    if (!bearer) return undefined;
    const auth = await verifyWillMcpBearer(bearer);
    if (!auth) return undefined;
    const scopes = auth.scopes.length > 0 ? auth.scopes : [...LEGACY_WILL_MCP_SCOPES];
    return {
      token: bearer,
      clientId: auth.tokenId,
      scopes,
      extra: { userId: auth.userId, tokenId: auth.tokenId, scopes },
    };
  },
  { required: true },
);

async function rateLimitedHandler(request: Request, context: unknown): Promise<Response> {
  const auth = await authenticateWillMcpRequest(request);
  if (auth) {
    const hit = await enforceLimit({
      limiter: userLimiter,
      identifier: auth.userId,
      context: "mcp.user",
    });
    if (!hit.ok) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
  } else {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const hit = await enforceLimit({
      limiter: unauthLimiter,
      identifier: ip,
      context: "mcp.user.unauth",
    });
    if (!hit.ok) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
  }
  return (authenticatedHandler as unknown as (req: Request, ctx: unknown) => Promise<Response>)(
    request,
    context,
  );
}

export const GET = rateLimitedHandler;
export const POST = rateLimitedHandler;
export const DELETE = rateLimitedHandler;

export const dynamic = "force-dynamic";
