"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  showGoogle,
  callbackUrl,
  error,
}: {
  showGoogle: boolean;
  callbackUrl?: string;
  error?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(error ?? null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setLocalError(null);
    const data = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: String(data.get("email") ?? "").toLowerCase(),
      password: String(data.get("password") ?? ""),
      redirect: false,
      callbackUrl: callbackUrl ?? "/app",
    });
    setPending(false);
    if (result?.ok) {
      router.replace(result.url ?? callbackUrl ?? "/app");
    } else {
      setLocalError("Invalid email or password.");
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium" htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
          />
        </div>
        {localError ? <p className="text-sm text-destructive">{localError}</p> : null}
        <button
          disabled={pending}
          type="submit"
          className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>

      {showGoogle ? (
        <div>
          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: callbackUrl ?? "/app" })}
            className="w-full rounded-md border px-4 py-2"
          >
            Continue with Google
          </button>
        </div>
      ) : null}

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/register" className="underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
