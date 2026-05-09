import { cookies, headers } from "next/headers";

/** Same name as trefolio / Clara — shared across `*.trefolio.com` for IdP authorize UI. */
export const TREFOLIO_UI_LOCALE_COOKIE = "trefolio_ui_locale";

const IDP_SUPPORTED = new Set(["en", "de", "es", "fr", "it"]);

/** Map app language tags to a single tag user.trefolio.com understands (OIDC `ui_locales`). */
export function mapAppLanguageToIdpUiLocalesTag(lang: string | undefined | null): string {
  if (!lang?.trim()) return "en";
  const primary = lang.trim().toLowerCase().split(/[-_]/)[0];
  if (IDP_SUPPORTED.has(primary)) return primary;
  return "en";
}

function primaryTagFromAcceptLanguage(header: string | null): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(",")) {
    const tag = part.split(";")[0]?.trim().toLowerCase();
    if (!tag) continue;
    const primary = tag.split(/[-_]/)[0];
    if (IDP_SUPPORTED.has(primary)) return primary;
  }
  return undefined;
}

/**
 * OIDC `ui_locales` for Will → user.trefolio.com: ecosystem cookie (set by any
 * Warren app on `.trefolio.com`) → Accept-Language → `en`.
 */
export async function resolveWillUiLocalesForIdpAuthorize(): Promise<string> {
  const jar = await cookies();
  const hdrs = await headers();
  const fromCookie = jar.get(TREFOLIO_UI_LOCALE_COOKIE)?.value;
  if (fromCookie?.trim()) {
    return mapAppLanguageToIdpUiLocalesTag(fromCookie);
  }
  return primaryTagFromAcceptLanguage(hdrs.get("accept-language")) ?? "en";
}
