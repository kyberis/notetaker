/**
 * Resolve the trefolio IdP base URL with sensible per-environment
 * defaults so that:
 *
 *   - Local dev      → `http://localhost:3300` (set via `.env.local`)
 *   - Production     → `https://user.trefolio.com` (built-in fallback,
 *                       overridable through Vercel env vars)
 *
 * Returning an empty string in dev when no env var is set keeps the
 * trefolio-id NextAuth provider from registering at all (its config is
 * gated on `IDP_BASE_URL` being truthy in `lib/auth/index.ts`).
 */
const PROD_IDP_BASE_URL = "https://user.trefolio.com";

function isVercelProduction(): boolean {
  return process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";
}

export function getIdpBaseUrl(): string {
  const v = process.env.IDP_BASE_URL?.trim();
  if (v) {
    const cleaned = v.replace(/\/+$/, "");
    // Vercel prod only: never send real users to a loopback IdP (mis-set env).
    if (
      isVercelProduction() &&
      /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(cleaned)
    ) {
      console.warn(
        "[idp] IDP_BASE_URL points at loopback on Vercel production; using %s",
        PROD_IDP_BASE_URL,
      );
      return PROD_IDP_BASE_URL;
    }
    return cleaned;
  }
  if (process.env.NODE_ENV === "production") return PROD_IDP_BASE_URL;
  return "";
}
