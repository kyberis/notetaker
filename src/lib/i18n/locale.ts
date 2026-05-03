/**
 * Locale primitives. Web UI is English-only by design — these locales drive
 * the AI agent and bot replies.
 *
 *  - `en` (default): English.
 *  - `es`: Spanish (neutral, leans Latin American).
 *  - `pt`: Portuguese (neutral, leans Brazilian).
 *  - `ar`: Modern Standard Arabic (RTL handled by Telegram clients).
 *
 * Resolution order:
 *  1. Authenticated `User.locale`.
 *  2. `NEXT_LOCALE` cookie.
 *  3. `Accept-Language` request header.
 *  4. Fallback: `en`.
 */

export const LOCALES = ["en", "es", "pt", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function normalizeLocale(value: string | null | undefined): Locale {
  if (!value) return DEFAULT_LOCALE;
  const lower = value.toLowerCase();
  if (lower.startsWith("en")) return "en";
  if (lower.startsWith("es")) return "es";
  if (lower.startsWith("pt")) return "pt";
  if (lower.startsWith("ar")) return "ar";
  return DEFAULT_LOCALE;
}

/** BCP-47 string for `Intl` APIs and `<html lang>`. */
export function toBcp47(locale: Locale): string {
  switch (locale) {
    case "en":
      return "en-US";
    case "es":
      return "es-ES";
    case "pt":
      return "pt-BR";
    case "ar":
      return "ar-SA";
  }
}

/** Native label for the language picker. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
  pt: "Português",
  ar: "العربية",
};

/** Best-effort `Accept-Language` parser for our supported set. */
export function pickFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, qPart] = part.trim().split(";");
      const q = qPart?.trim().startsWith("q=") ? Number(qPart.slice(2)) || 0 : 1;
      return { tag: tag.toLowerCase(), q };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of ranked) {
    if (tag.startsWith("en")) return "en";
    if (tag.startsWith("es")) return "es";
    if (tag.startsWith("pt")) return "pt";
    if (tag.startsWith("ar")) return "ar";
  }
  return DEFAULT_LOCALE;
}

/** Whether this locale is rendered right-to-left in normal writing systems. */
export function isRtl(locale: Locale): boolean {
  return locale === "ar";
}
