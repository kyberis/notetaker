/**
 * Escapes a string for Telegram's HTML parse_mode. We use HTML rather than
 * MarkdownV2 because escaping rules are simpler and rendering is identical
 * for our use case (we never need code blocks).
 *
 * https://core.telegram.org/bots/api#html-style
 */
export function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/** Bold wrapper that escapes the inner text. */
export function bold(input: string): string {
  return `<b>${escapeHtml(input)}</b>`;
}

/** Italic wrapper that escapes the inner text. */
export function italic(input: string): string {
  return `<i>${escapeHtml(input)}</i>`;
}

/**
 * Strip CommonMark emphasis / code markers so the result reads cleanly when
 * synthesised to speech. Bold / italic / code wrappers collapse to their
 * inner text; everything else is preserved.
 */
export function stripAgentMarkdown(input: string): string {
  if (!input) return "";
  return input
    .replace(/\*\*([\s\S]+?)\*\*/g, "$1")
    .replace(/__([\s\S]+?)__/g, "$1")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/(?<![*_\w])[*_]([^*_\n]+?)[*_](?![*_\w])/g, "$1");
}

/**
 * Convert the agent's CommonMark-flavoured reply into Telegram HTML.
 *
 * Why: gpt-4o-mini (and most chat models) emphasise terms with `**bold**` /
 * `*italic*` / `_italic_` / `` `code` `` even when the system prompt asks them
 * not to. With `parse_mode: "HTML"` Telegram renders those characters
 * literally, so the user sees `**Listo!**` instead of bold "Listo!". Mirrors
 * Clara's `formatAgentMarkdownForTelegramHtml` so both bots feel consistent.
 *
 * Rules:
 * - `**text**` and `__text__` → `<b>text</b>`.
 * - Single `*text*` / `_text_` (not part of a `**`/`__` pair) → `<i>text</i>`.
 * - `` `code` `` → `<code>code</code>`.
 * - Bare `<`, `>`, `&` outside of those wrappers are HTML-escaped.
 * - Anything else passes through verbatim.
 */
export function formatAgentMarkdownForTelegramHtml(input: string): string {
  if (!input) return "";

  const tokens = input.split(/(\*\*[\s\S]+?\*\*|__[\s\S]+?__|`[^`\n]+`|(?<![*_\w])[*_][^*_\n]+?[*_](?![*_\w]))/g);

  return tokens
    .map((part) => {
      if (!part) return "";

      const strong = /^(?:\*\*([\s\S]+?)\*\*|__([\s\S]+?)__)$/.exec(part);
      if (strong) {
        const inner = strong[1] ?? strong[2] ?? "";
        return `<b>${escapeHtml(inner)}</b>`;
      }

      const code = /^`([^`\n]+)`$/.exec(part);
      if (code) {
        return `<code>${escapeHtml(code[1])}</code>`;
      }

      const emphasis = /^([*_])([^*_\n]+?)\1$/.exec(part);
      if (emphasis) {
        return `<i>${escapeHtml(emphasis[2])}</i>`;
      }

      return escapeHtml(part);
    })
    .join("");
}

/**
 * Telegram has a 4096-character limit on a single message. When we exceed
 * it (rare — long PDFs in chat) split on newlines so the chunks render
 * cleanly.
 */
export function chunkForTelegram(input: string, max = 4000): string[] {
  if (input.length <= max) return [input];
  const chunks: string[] = [];
  let remaining = input;
  while (remaining.length > max) {
    let cut = remaining.lastIndexOf("\n", max);
    if (cut < max / 2) cut = max;
    chunks.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut).trimStart();
  }
  if (remaining.length) chunks.push(remaining);
  return chunks;
}
