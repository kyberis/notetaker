import type { NextResponse } from "next/server";

import type { Locale } from "@/lib/i18n/locale";

export const TREFOLIO_UI_LOCALE_COOKIE = "trefolio_ui_locale";

export function ecosystemCookieDomainFromHost(host: string | null | undefined): string | undefined {
  if (!host) return undefined;
  const h = host.split(",")[0]?.trim().split(":")[0]?.toLowerCase() ?? "";
  if (!h || h === "localhost" || h.startsWith("127.")) return undefined;
  const parts = h.split(".");
  if (parts.length < 2) return undefined;
  return `.${parts.slice(-2).join(".")}`;
}

/** IdP authorize supports en | de | es | fr | it only. */
export function willLocaleToIdpUiTag(locale: Locale): string {
  if (locale === "es") return "es";
  return "en";
}

export function setTrefolioUiLocaleCookieOnResponse(
  req: Request,
  res: NextResponse,
  willLocale: Locale,
): void {
  const value = willLocaleToIdpUiTag(willLocale);
  const host =
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || req.headers.get("host") || "";
  const domain = ecosystemCookieDomainFromHost(host);
  const ttl = 60 * 60 * 24 * 365;
  res.cookies.set(TREFOLIO_UI_LOCALE_COOKIE, value, {
    path: "/",
    maxAge: ttl,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
    ...(domain ? { domain } : {}),
  });
}
