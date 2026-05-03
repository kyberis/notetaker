import { describe, expect, it } from "vitest";

import {
  chunkForTelegram,
  escapeHtml,
  formatAgentMarkdownForTelegramHtml,
  stripAgentMarkdown,
} from "./format";

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

describe("formatAgentMarkdownForTelegramHtml", () => {
  it("converts double-asterisk bold to <b>", () => {
    expect(formatAgentMarkdownForTelegramHtml("**Listo!** Guardé tu nota.")).toBe(
      "<b>Listo!</b> Guardé tu nota.",
    );
  });

  it("converts double-underscore bold to <b>", () => {
    expect(formatAgentMarkdownForTelegramHtml("__Marry__, 'tis done")).toBe(
      "<b>Marry</b>, 'tis done",
    );
  });

  it("converts single asterisk italic to <i>", () => {
    expect(formatAgentMarkdownForTelegramHtml("Tag: *idea*")).toBe(
      "Tag: <i>idea</i>",
    );
  });

  it("converts single underscore italic to <i>", () => {
    expect(formatAgentMarkdownForTelegramHtml("hint _here_")).toBe(
      "hint <i>here</i>",
    );
  });

  it("does not split intra-word underscores", () => {
    expect(formatAgentMarkdownForTelegramHtml("snake_case_thing")).toBe(
      "snake_case_thing",
    );
  });

  it("converts inline backticks to <code>", () => {
    expect(formatAgentMarkdownForTelegramHtml("call `saveNote` next")).toBe(
      "call <code>saveNote</code> next",
    );
  });

  it("escapes raw HTML chars outside markup", () => {
    expect(formatAgentMarkdownForTelegramHtml("a <b> & c > d")).toBe(
      "a &lt;b&gt; &amp; c &gt; d",
    );
  });

  it("escapes HTML chars inside bold runs too", () => {
    expect(formatAgentMarkdownForTelegramHtml("**a<b>c**")).toBe(
      "<b>a&lt;b&gt;c</b>",
    );
  });

  it("returns empty string for empty input", () => {
    expect(formatAgentMarkdownForTelegramHtml("")).toBe("");
  });

  it("handles mixed bold and italic without leaking asterisks", () => {
    expect(
      formatAgentMarkdownForTelegramHtml("**Marry**, _milord_, 'tis *done*."),
    ).toBe("<b>Marry</b>, <i>milord</i>, 'tis <i>done</i>.");
  });

  it("leaves an unmatched lone asterisk alone", () => {
    expect(formatAgentMarkdownForTelegramHtml("2 * 3 = 6")).toBe("2 * 3 = 6");
  });
});

describe("stripAgentMarkdown", () => {
  it("removes bold, italic and code markers", () => {
    expect(
      stripAgentMarkdown("**Marry**, _milord_, `saveNote` is *done*."),
    ).toBe("Marry, milord, saveNote is done.");
  });

  it("returns empty string for empty input", () => {
    expect(stripAgentMarkdown("")).toBe("");
  });

  it("preserves intra-word underscores", () => {
    expect(stripAgentMarkdown("snake_case_thing")).toBe("snake_case_thing");
  });
});
