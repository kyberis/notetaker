import { describe, expect, it } from "vitest";

import { normalizeTagName } from "./tags";

describe("normalizeTagName", () => {
  it("strips leading hashes and lowercases", () => {
    expect(normalizeTagName("#Idea")).toBe("idea");
    expect(normalizeTagName("##  Mum's Birthday!")).toBe("mum-s-birthday");
  });

  it("collapses internal whitespace and unsupported chars to single dash", () => {
    expect(normalizeTagName("buy   flowers @home")).toBe("buy-flowers-home");
  });

  it("supports unicode letters", () => {
    expect(normalizeTagName("Año Nuevo")).toBe("año-nuevo");
    expect(normalizeTagName("ذكرى")).toBe("ذكرى");
  });

  it("clips at 32 chars", () => {
    const tag = "a".repeat(50);
    expect(normalizeTagName(tag).length).toBeLessThanOrEqual(32);
  });
});
