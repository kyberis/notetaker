"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

import { ACCOUNT_DELETION_GRACE_DAYS } from "@/lib/legal";

export function DeleteAccountSection() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState("");

  async function onDelete() {
    if (confirm !== "DELETE") {
      setError("Type DELETE to confirm.");
      return;
    }
    setPending(true);
    setError(null);
    const res = await fetch("/api/account/delete", { method: "POST" });
    if (!res.ok) {
      setPending(false);
      setError("Couldn't delete. Try again or contact support.");
      return;
    }
    await signOut({ callbackUrl: "/" });
  }

  return (
    <div className="space-y-3">
      <p>
        Mark your account for deletion. We'll keep it soft-deleted for{" "}
        {ACCOUNT_DELETION_GRACE_DAYS} days, then hard-delete every note, tag,
        reminder, and identifier. Sign in within those {ACCOUNT_DELETION_GRACE_DAYS}{" "}
        days to cancel.
      </p>
      <div>
        <label className="block text-xs text-muted-foreground" htmlFor="confirm">
          Type DELETE to confirm
        </label>
        <input
          id="confirm"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mt-1 w-full max-w-xs rounded-md border bg-background px-3 py-2"
        />
      </div>
      <button
        onClick={onDelete}
        disabled={pending}
        className="rounded-md bg-destructive px-4 py-2 text-destructive-foreground disabled:opacity-50"
      >
        {pending ? "Deleting..." : "Delete my account"}
      </button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
