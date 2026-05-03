import { describe, expect, it } from "vitest";

import { chunkForTelegram, escapeHtml } from "./format";

describe("escapeHtml", () => {
  it("escapes the three HTML chars", () => {
    expect(escapeHtml("<b>x & y</b>")).toBe("&lt;b&gt;x &amp; y&lt;/b&gt;");
  });
});

describe("chunkForTelegram", () => {
  it("returns a single chunk when under the limit", () => {
    expect(chunkForTelegram("hi", 100)).toEqual(["hi"]);
  });

  it("splits long input on newline boundaries when possible", () => {
    const input = "a".repeat(50) + "\n" + "b".repeat(60);
    const out = chunkForTelegram(input, 80);
    expect(out.length).toBeGreaterThan(1);
    expect(out.join("")).toContain("a".repeat(50));
    expect(out.join("")).toContain("b".repeat(60));
  });
});
