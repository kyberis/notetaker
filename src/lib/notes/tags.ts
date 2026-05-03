/**
 * Tag-name normalisation. Tags are lowercased, no leading "#", no spaces,
 * Unicode letters/digits/dashes/underscores allowed. We strip everything
 * else so a user can paste "#Mum's Birthday!" and get back `mums-birthday`.
 */
export function normalizeTagName(raw: string): string {
  const trimmed = raw.trim().toLowerCase().replace(/^#+/, "");
  // Replace runs of whitespace and unsupported chars with a single dash.
  // Keep letters/numbers/underscore/dash from any script (Unicode-aware).
  const normalized = trimmed
    .replace(/[^\p{L}\p{N}_-]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return normalized.slice(0, 32);
}

/** Default tag name reserved for reminder-bearing notes. */
export const REMINDER_TAG_NAME = "reminder";
