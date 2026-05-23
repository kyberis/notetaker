import { describe, expect, it } from "vitest";

import { formatOfficeNoteExcerpt } from "./search-office-notes";

describe("formatOfficeNoteExcerpt", () => {
  it("returns short bodies unchanged", () => {
    expect(formatOfficeNoteExcerpt("Diversify into infra")).toBe("Diversify into infra");
  });

  it("truncates long bodies with ellipsis", () => {
    const long = "a".repeat(200);
    const excerpt = formatOfficeNoteExcerpt(long, 40);
    expect(excerpt.length).toBeLessThanOrEqual(40);
    expect(excerpt.endsWith("…")).toBe(true);
  });

  it("collapses whitespace", () => {
    expect(formatOfficeNoteExcerpt("line one\n\nline two")).toBe("line one line two");
  });
});
