"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";

interface Props {
  callbackUrl?: string;
}

/**
 * Bridges the unified-login flow: when the IdP is enabled and legacy auth
 * is off, /login renders this component, which posts to NextAuth's CSRF +
 * provider endpoints to start the OIDC redirect to user.trefolio.com.
 *
 * Default `callbackUrl` is `/app` so a successful login lands in the product,
 * not the marketing homepage (`/`).
 */
export default function IdpAutoRedirect({ callbackUrl }: Props) {
  useEffect(() => {
    void signIn("trefolio-id", { callbackUrl: callbackUrl || "/app" });
  }, [callbackUrl]);

  return (
    <div className="p-8 text-center text-sm text-muted-foreground">
      Redirecting to trefolio sign-in…
    </div>
  );
}
