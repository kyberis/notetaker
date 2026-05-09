"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";

interface Props {
  callbackUrl?: string;
  /** OIDC `ui_locales` tag for user.trefolio.com (e.g. `es`, `de`). */
  uiLocales: string;
}

/**
 * Bridges the unified-login flow: when the IdP is enabled and legacy auth
 * is off, /login renders this component, which posts to NextAuth's CSRF +
 * provider endpoints to start the OIDC redirect to user.trefolio.com.
 * Passes `ui_locales` so the IdP matches the ecosystem language cookie (not
 * only the browser default).
 *
 * Default `callbackUrl` is `/app` so a successful login lands in the product,
 * not the marketing homepage (`/`).
 */
export default function IdpAutoRedirect({ callbackUrl, uiLocales }: Props) {
  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get("error");
    if (err) return;
    void signIn(
      "trefolio-id",
      { callbackUrl: callbackUrl || "/app" },
      { ui_locales: uiLocales },
    );
  }, [callbackUrl, uiLocales]);

  return (
    <div className="p-8 text-center text-sm text-muted-foreground">
      Redirecting to trefolio sign-in…
    </div>
  );
}
