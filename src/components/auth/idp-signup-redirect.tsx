"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";

interface Props {
  callbackUrl?: string;
}

/**
 * IdP-only registration: OAuth to accounts with signup-first UI.
 */
export default function IdpSignupRedirect({ callbackUrl }: Props) {
  useEffect(() => {
    void signIn(
      "trefolio-id",
      { callbackUrl: callbackUrl || "/app" },
      { app_hint: "will", screen_hint: "signup" },
    );
  }, [callbackUrl]);

  return (
    <div className="p-8 text-center text-sm text-muted-foreground">
      Redirecting to create your account…
    </div>
  );
}
