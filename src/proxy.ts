import { NextResponse, type NextRequest } from "next/server";

/**
 * Routing proxy (Next 16 renamed `middleware` → `proxy`). Applies security
 * headers globally. Auth gating happens in page-level `pageRequireAuth()`
 * calls, not here, so we don't have to keep two sources of truth in sync.
 */
export function proxy(_req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return res;
}

export const config = {
  matcher: [
    // Skip Next.js internals + static assets.
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|llms.txt|.well-known).*)",
  ],
};
