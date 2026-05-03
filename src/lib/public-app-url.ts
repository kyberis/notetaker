/**
 * Base URL reachable by external services (Telegram bot webhook, OG images,
 * sitemap.xml, llms.txt, etc.). Order:
 *   1. NEXT_PUBLIC_APP_URL  — explicit, set by the operator.
 *   2. VERCEL_URL           — auto-provisioned by Vercel for previews.
 *   3. null                 — let the caller decide a fallback.
 */
export function getPublicAppBaseUrl(): string | null {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return null;
}
