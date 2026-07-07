import {
  DEFAULT_WILL_MCP_SCOPES,
  hasWillScope,
  isWillMcpScope,
  LEGACY_WILL_MCP_SCOPES,
  requiredWillScopeForTool,
  type WillMcpScope,
} from "@/lib/mcp/pat-scopes";

export function jsonContent(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

export function errContent(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true as const,
  };
}

export function getUserIdFromExtra(extra: { authInfo?: { extra?: Record<string, unknown> } }) {
  const userId = extra.authInfo?.extra?.userId;
  return typeof userId === "string" && userId.length > 0 ? userId : null;
}

export function getWillScopesFromExtra(extra: {
  authInfo?: { extra?: Record<string, unknown> };
}): WillMcpScope[] {
  const raw = extra.authInfo?.extra?.scopes;
  if (Array.isArray(raw)) {
    const filtered = raw.filter((s): s is WillMcpScope => typeof s === "string" && isWillMcpScope(s));
    if (raw.length > 0 && filtered.length === 0) return [];
    return filtered.length > 0 ? filtered : DEFAULT_WILL_MCP_SCOPES;
  }
  return LEGACY_WILL_MCP_SCOPES;
}

export function requireWillMcpToolScope(
  extra: { authInfo?: { extra?: Record<string, unknown> } },
  toolName: string,
) {
  const required = requiredWillScopeForTool(toolName);
  if (!required) return null;
  const granted = getWillScopesFromExtra(extra);
  if (!hasWillScope(granted, required)) {
    return errContent(
      `Forbidden: missing PAT scope "${required}" for tool ${toolName}. Add it when minting the token at user.trefolio.com → Developer.`,
    );
  }
  return null;
}

type McpToolError = ReturnType<typeof errContent>;

export function gateWillMcpTool(
  extra: { authInfo?: { extra?: Record<string, unknown> } },
  toolName: string,
): { ok: true; userId: string } | { ok: false; response: McpToolError } {
  const userId = getUserIdFromExtra(extra);
  if (!userId) return { ok: false, response: errContent("Unauthorized.") };
  const scopeErr = requireWillMcpToolScope(extra, toolName);
  if (scopeErr) return { ok: false, response: scopeErr };
  return { ok: true, userId };
}
