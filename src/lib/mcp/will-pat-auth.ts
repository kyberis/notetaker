import { introspectTfpPat, isTfpPatToken } from "@/lib/accounts-pat-introspect";
import { resolveWillUserIdFromIdpSub } from "@/lib/mcp/resolve-will-user-from-idp-sub";

export type WillMcpAuth = { userId: string; tokenId: string };

/** Will MCP accepts only unified `tfp_pat_…` tokens (minted on user.trefolio.com). */
export async function verifyWillMcpBearer(
  bearer: string | null | undefined,
): Promise<WillMcpAuth | null> {
  if (!bearer) return null;
  const trimmed = bearer.trim();
  if (!isTfpPatToken(trimmed)) return null;
  const intro = await introspectTfpPat(trimmed);
  if (!intro) return null;
  const userId = await resolveWillUserIdFromIdpSub(intro.sub);
  if (!userId) return null;
  return { userId, tokenId: intro.tokenId ? `acc:${intro.tokenId}` : "acc:unknown" };
}

export function extractBearer(headers: Headers): string | null {
  const auth = headers.get("authorization");
  if (!auth) return null;
  const [scheme, ...rest] = auth.split(" ");
  if (scheme?.toLowerCase() !== "bearer") return null;
  const value = rest.join(" ").trim();
  return value || null;
}

export async function authenticateWillMcpRequest(request: Request): Promise<WillMcpAuth | null> {
  return verifyWillMcpBearer(extractBearer(request.headers));
}
