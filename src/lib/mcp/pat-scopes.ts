/** Will MCP PAT scopes — keep in sync with external/accounts/src/lib/pat-scopes.ts */
export const WILL_MCP_SCOPE_IDS = ["notes:read", "notes:write"] as const;

export type WillMcpScope = (typeof WILL_MCP_SCOPE_IDS)[number];

export const DEFAULT_WILL_MCP_SCOPES: WillMcpScope[] = ["notes:read"];

export const LEGACY_WILL_MCP_SCOPES: WillMcpScope[] = [...WILL_MCP_SCOPE_IDS];

export function isWillMcpScope(value: string): value is WillMcpScope {
  return (WILL_MCP_SCOPE_IDS as readonly string[]).includes(value);
}

export function resolveEffectiveWillScopes(stored: readonly string[] | null | undefined): WillMcpScope[] {
  if (stored == null) return LEGACY_WILL_MCP_SCOPES;
  const filtered = stored.filter((s): s is WillMcpScope => isWillMcpScope(s));
  return filtered.length > 0 ? filtered : DEFAULT_WILL_MCP_SCOPES;
}

export function hasWillScope(granted: readonly string[], required: WillMcpScope): boolean {
  return granted.includes(required);
}

export const WILL_MCP_TOOL_REQUIRED_SCOPE: Record<string, WillMcpScope> = {
  getProfile: "notes:read",
  listRecentNotes: "notes:read",
  searchNotes: "notes:read",
  getNote: "notes:read",
  createNote: "notes:write",
};

export function requiredWillScopeForTool(toolName: string): WillMcpScope | undefined {
  return WILL_MCP_TOOL_REQUIRED_SCOPE[toolName];
}
