import { describe, it, expect } from "vitest";

import {
  hasWillScope,
  isWillMcpScope,
  requiredWillScopeForTool,
  resolveEffectiveWillScopes,
} from "@/lib/mcp/pat-scopes";

describe("will pat-scopes", () => {
  it("recognizes notes scopes", () => {
    expect(isWillMcpScope("notes:read")).toBe(true);
    expect(isWillMcpScope("finance:read")).toBe(false);
  });

  it("maps createNote to notes:write", () => {
    expect(requiredWillScopeForTool("createNote")).toBe("notes:write");
  });

  it("legacy null grants full Will access", () => {
    expect(resolveEffectiveWillScopes(null)).toEqual(["notes:read", "notes:write"]);
  });

  it("hasWillScope checks membership", () => {
    expect(hasWillScope(["notes:read"], "notes:write")).toBe(false);
    expect(hasWillScope(["notes:read", "notes:write"], "notes:write")).toBe(true);
  });
});
