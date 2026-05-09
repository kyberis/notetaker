"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";

interface Props {
  callbackUrl?: string;
  /** OIDC `ui_locales` tag for user.trefolio.com. */
  uiLocales: string;
}

/**
 * IdP-only registration: OAuth to accounts with signup-first UI.
 */
export default function IdpSignupRedirect({ callbackUrl, uiLocales }: Props) {
  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get("error");
    if (err) return;
    void signIn(
      "trefolio-id",
      { callbackUrl: callbackUrl || "/app" },
      { app_hint: "will", screen_hint: "signup", ui_locales: uiLocales },
    );
  }, [callbackUrl, uiLocales]);

  return (
    <div className="p-8 text-center text-sm text-muted-foreground">
      Redirecting to create your account…
    </div>
  );
}
