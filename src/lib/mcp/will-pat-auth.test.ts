import { beforeEach, describe, expect, it, vi } from "vitest";

const mockIntrospect = vi.hoisted(() => vi.fn());
const mockResolve = vi.hoisted(() => vi.fn());

vi.mock("@/lib/accounts-pat-introspect", () => ({
  isTfpPatToken: (s: string) => String(s).trim().startsWith("tfp_pat_"),
  introspectTfpPat: (t: string) => mockIntrospect(t),
}));

vi.mock("@/lib/mcp/resolve-will-user-from-idp-sub", () => ({
  resolveWillUserIdFromIdpSub: (sub: string) => mockResolve(sub),
}));

import {
  authenticateWillMcpRequest,
  extractBearer,
  verifyWillMcpBearer,
} from "./will-pat-auth";

describe("will-pat-auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("extractBearer", () => {
    it("parses Bearer", () => {
      const h = new Headers({ Authorization: "Bearer tfp_pat_x" });
      expect(extractBearer(h)).toBe("tfp_pat_x");
    });
    it("returns null for missing header", () => {
      expect(extractBearer(new Headers())).toBeNull();
    });
  });

  it("verifyWillMcpBearer returns null for non-tfp prefix", async () => {
    expect(await verifyWillMcpBearer("other")).toBeNull();
    expect(mockIntrospect).not.toHaveBeenCalled();
  });

  it("returns null when introspect fails", async () => {
    mockIntrospect.mockResolvedValueOnce(null);
    expect(await verifyWillMcpBearer("tfp_pat_a")).toBeNull();
  });

  it("returns null when no local Will user", async () => {
    mockIntrospect.mockResolvedValueOnce({ sub: "sub", tokenId: "t1" });
    mockResolve.mockResolvedValueOnce(null);
    expect(await verifyWillMcpBearer("tfp_pat_a")).toBeNull();
  });

  it("returns userId on success", async () => {
    mockIntrospect.mockResolvedValueOnce({ sub: "sub", tokenId: "t1" });
    mockResolve.mockResolvedValueOnce("will-user-id");
    expect(await verifyWillMcpBearer("tfp_pat_a")).toEqual({
      userId: "will-user-id",
      tokenId: "acc:t1",
    });
  });

  it("authenticateWillMcpRequest reads Authorization header", async () => {
    mockIntrospect.mockResolvedValueOnce({ sub: "s", tokenId: "" });
    mockResolve.mockResolvedValueOnce("uid");
    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer tfp_pat_z" },
    });
    const auth = await authenticateWillMcpRequest(req);
    expect(auth?.userId).toBe("uid");
  });
});
