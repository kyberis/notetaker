/**
 * Telegram text formatting.
 *
 * The rules now live in `@kyberis/agent-os/channels`, shared with Clara and
 * Warren — a missed escape used to be three separate bugs. Will keeps this
 * module as its own vocabulary over the shared implementation, and keeps
 * splitting at 4000 characters, which is what it has always done.
 *
 * @see https://core.telegram.org/bots/api#html-style
 */

import {
  chunkMessage,
  escapeHtml,
  markdownToTelegramHtml,
  stripMarkdown,
} from "@kyberis/agent-os/channels";

export { escapeHtml };

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
 * synthesised to speech.
 */
export function stripAgentMarkdown(input: string): string {
  return stripMarkdown(input);
}

/**
 * Convert the agent's CommonMark-flavoured reply into Telegram HTML.
 *
 * Why: gpt-4o-mini (and most chat models) emphasise terms with `**bold**` /
 * `*italic*` / `_italic_` / `` `code` `` even when the system prompt asks them
 * not to. With `parse_mode: "HTML"` Telegram renders those characters
 * literally, so the user sees `**Listo!**` instead of bold "Listo!".
 */
export function formatAgentMarkdownForTelegramHtml(input: string): string {
  return markdownToTelegramHtml(input);
}

/**
 * Telegram has a 4096-character limit on a single message. When we exceed it
 * (rare — long PDFs in chat) split on newlines so the chunks render cleanly.
 */
export function chunkForTelegram(input: string, max = 4000): string[] {
  return chunkMessage(input, { max });
}
