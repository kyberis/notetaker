"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AcceptTermsForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onAccept() {
    setPending(true);
    setError(null);
    const res = await fetch("/api/account/accept-terms", { method: "POST" });
    setPending(false);
    if (res.ok) router.replace("/app");
    else setError("Couldn't save your acceptance.");
  }

  return (
    <div className="mt-6 space-y-3">
      <p className="text-sm">
        Read the{" "}
        <Link href="/terms" className="underline">terms</Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline">privacy policy</Link>.
      </p>
      <button
        onClick={onAccept}
        disabled={pending}
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Saving..." : "I accept"}
      </button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
