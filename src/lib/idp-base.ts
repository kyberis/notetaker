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

/** True only on a real Vercel production deployment — not `next dev` with stray `VERCEL=*` from `vercel env pull`. */
function isVercelProduction(): boolean {
  return (
    process.env.VERCEL === "1" &&
    process.env.VERCEL_ENV === "production" &&
    process.env.NODE_ENV === "production"
  );
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

/**
 * Whether Will is configured to use the unified IdP (`user.trefolio.com`) via
 * NextAuth provider `trefolio-id`. Requires full OAuth client env.
 */
export function isWillIdpOAuthConfigured(): boolean {
  return (
    Boolean(getIdpBaseUrl()) &&
    Boolean(process.env.IDP_CLIENT_ID?.trim()) &&
    Boolean(process.env.IDP_CLIENT_SECRET?.trim())
  );
}

/**
 * @deprecated Use {@link isWillIdpOAuthConfigured}; kept for call sites that
 * read "unified" in the name.
 */
export function shouldSendUsersToUnifiedIdp(): boolean {
  return isWillIdpOAuthConfigured();
}

/**
 * Browser-facing IdP origin for outbound links. Prefer `IDP_ISSUER` when set.
 */
export function getIdpBrowserOrigin(): string {
  const iss = process.env.IDP_ISSUER?.trim().replace(/\/+$/g, "");
  if (iss) return iss;
  return getIdpBaseUrl();
}

/**
 * Public upgrade URL on the IdP (Trefolio Pro). Pass IdP `sub` when the User row stores it.
 */
export function buildIdpUpgradeUrlForWill(
  idpSub: string | null | undefined,
  opts?: { interval?: "monthly" | "annual" },
): string {
  const base = getIdpBrowserOrigin() || getIdpBaseUrl();
  const u = new URL(`${base}/upgrade`);
  u.searchParams.set("from", "will");
  if (idpSub) u.searchParams.set("sub", idpSub);
  if (opts?.interval) u.searchParams.set("interval", opts.interval);
  return u.toString();
}

/** Unified account hub on user.trefolio.com (profile, passkeys, password). */
export function buildIdpAccountUrlForWill(): string | null {
  if (!isWillIdpOAuthConfigured()) return null;
  const origin = getIdpBrowserOrigin();
  if (!origin) return null;
  const u = new URL(`${origin.replace(/\/+$/, "")}/account`);
  u.searchParams.set("from", "will");
  return u.toString();
}
