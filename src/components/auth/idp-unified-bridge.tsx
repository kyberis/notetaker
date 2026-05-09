"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";

const DEFAULT_SECONDS = 4;

const COPY = {
  login: {
    heading: "Unified sign-in",
    body: "You are being redirected to the shared trefolio account at user.trefolio.com. The same sign-in works across trefolio, Clara, and Will.",
  },
  signup: {
    heading: "Unified registration",
    body: "You are being redirected to create your account at user.trefolio.com. One account unlocks trefolio, Clara, and Will.",
  },
  countdown: (s: number) => `Continuing in ${s}s…`,
  continue: "Continue now",
  retry: "Try again",
  errorTitle: "We could not finish signing you in",
  idpDisabledTitle: "Sign-in is not configured",
  idpDisabledBody:
    "This Will deployment is not connected to the trefolio account service. Set IDP_BASE_URL and OAuth client credentials.",
} as const;

type Mode = "login" | "signup";

export interface IdpUnifiedBridgeProps {
  mode: Mode;
  callbackUrl?: string;
  uiLocales: string;
  error?: string | null;
  idpDisabled?: boolean;
}

export function IdpUnifiedBridge({
  mode,
  callbackUrl,
  uiLocales,
  error,
  idpDisabled,
}: IdpUnifiedBridgeProps) {
  const [secondsLeft, setSecondsLeft] = useState(
    error || idpDisabled ? 0 : DEFAULT_SECONDS,
  );
  const doneRef = useRef(false);

  const startSignIn = useCallback(() => {
    if (doneRef.current || idpDisabled) return;
    doneRef.current = true;
    const base = { callbackUrl: callbackUrl || "/app" };
    const authParams: Record<string, string> =
      mode === "signup"
        ? { app_hint: "will", screen_hint: "signup", ui_locales: uiLocales }
        : { app_hint: "will", ui_locales: uiLocales };
    void signIn("trefolio-id", base, authParams);
  }, [callbackUrl, mode, uiLocales, idpDisabled]);

  useEffect(() => {
    if (error || idpDisabled) return;

    if (secondsLeft === 0) {
      startSignIn();
      return;
    }

    const id = window.setTimeout(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);

    return () => window.clearTimeout(id);
  }, [secondsLeft, error, idpDisabled, startSignIn]);

  const c = mode === "signup" ? COPY.signup : COPY.login;
  const heading = idpDisabled
    ? COPY.idpDisabledTitle
    : error
      ? COPY.errorTitle
      : c.heading;
  const body = idpDisabled ? COPY.idpDisabledBody : error ? error : c.body;

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 text-card-foreground shadow-sm">
        <h1 className="text-center text-xl font-semibold">{heading}</h1>
        <p className="mt-4 text-center text-sm text-muted-foreground leading-relaxed">{body}</p>

        {!error && !idpDisabled ? (
          <>
            <p className="mt-6 text-center text-sm font-medium" role="status" aria-live="polite">
              {COPY.countdown(secondsLeft)}
            </p>
            <button
              type="button"
              className="mt-6 w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
              onClick={startSignIn}
            >
              {COPY.continue}
            </button>
          </>
        ) : !idpDisabled ? (
          <button
            type="button"
            className="mt-6 w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
            onClick={startSignIn}
          >
            {COPY.retry}
          </button>
        ) : null}
      </div>
    </main>
  );
}
