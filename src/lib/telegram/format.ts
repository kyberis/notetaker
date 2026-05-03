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
