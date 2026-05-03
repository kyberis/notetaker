"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export function RegisterForm({ showGoogle }: { showGoogle: boolean }) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const data = new FormData(e.currentTarget);
    const payload = {
      email: String(data.get("email") ?? "").toLowerCase(),
      password: String(data.get("password") ?? ""),
      name: String(data.get("name") ?? "").trim() || undefined,
      acceptTerms: data.get("accept") === "on",
    };
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    setPending(false);
    if (res.ok) {
      setDone(true);
    } else {
      const json = (await res.json().catch(() => ({}))) as { message?: string };
      setError(json.message ?? "Sign-up failed.");
    }
  }

  if (done) {
    return (
      <div className="rounded-md border p-4">
        <p className="text-sm">
          Account created. We sent a confirmation link to your inbox — click it
          to activate sign-in.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Didn't get it? Check spam, or contact us via /contact.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium" htmlFor="name">Name (optional)</label>
          <input
            id="name"
            name="name"
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
            autoComplete="name"
          />
        </div>
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
            minLength={8}
            autoComplete="new-password"
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
          />
          <p className="mt-1 text-xs text-muted-foreground">At least 8 characters.</p>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="accept" required className="mt-1" />
          <span>
            I accept the{" "}
            <Link href="/terms" className="underline">terms</Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline">privacy policy</Link>.
          </span>
        </label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <button
          disabled={pending}
          type="submit"
          className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          {pending ? "Creating..." : "Create account"}
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
            onClick={() => signIn("google", { callbackUrl: "/app" })}
            className="w-full rounded-md border px-4 py-2"
          >
            Continue with Google
          </button>
        </div>
      ) : null}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="underline">Sign in</Link>
      </p>
    </div>
  );
}
