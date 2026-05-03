import crypto from "node:crypto";

/**
 * Telegram caps the `start` query parameter on `t.me/<bot>?start=<code>`
 * at 64 characters and only allows `A-Z a-z 0-9 _ -`. Long signed JWTs
 * cannot be used here; we persist a short random code on `User` instead
 * and look it up server-side when the bot receives `/start <code>`.
 */
export const TELEGRAM_DEEP_LINK_START_MAX_LEN = 64;

/** How long a freshly-issued link code is valid for (web → bot pairing). */
export const TELEGRAM_LINK_TTL_MINUTES = 15;

export function generateTelegramLinkCode(): string {
  return crypto
    .randomBytes(12)
    .toString("base64url")
    .replace(/=/g, "")
    .slice(0, 16);
}

/**
 * Returns the public deep-link URL the web settings page should open. The
 * bot username comes from env so the same code works for prod, preview, and
 * any custom deploys.
 */
export function buildTelegramDeepLink(code: string): string {
  if (code.length > TELEGRAM_DEEP_LINK_START_MAX_LEN) {
    throw new Error(
      `Telegram ?start= payload exceeds ${TELEGRAM_DEEP_LINK_START_MAX_LEN} characters`,
    );
  }
  const username = process.env.TELEGRAM_BOT_USERNAME?.trim();
  if (!username) {
    throw new Error("Missing TELEGRAM_BOT_USERNAME");
  }
  const handle = username.startsWith("@") ? username.slice(1) : username;
  return `https://t.me/${handle}?start=${encodeURIComponent(code)}`;
}
