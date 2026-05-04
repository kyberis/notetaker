"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  userId: string;
  email: string;
  isActive: boolean;
  /** When true, the button is rendered as inert (the actor cannot toggle their own row). */
  isSelf?: boolean;
};

/**
 * Inline disable / enable toggle used on `/admin/users`. The page is a server
 * component, so this small client island handles the confirm + fetch + refresh
 * cycle without re-hydrating the whole table.
 */
export function UserActiveToggle({ userId, email, isActive, isSelf }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (isSelf) {
    return (
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        you
      </span>
    );
  }

  const onClick = () => {
    const verb = isActive ? "Disable" : "Enable";
    const confirmed = window.confirm(
      `${verb} ${email}?\n\n${
        isActive
          ? "They will be signed out on the next request and Telegram messages will be ignored until re-enabled."
          : "They will be able to sign in again."
      }`,
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.message ?? "Could not update user.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-busy={pending}
        className={
          isActive
            ? "rounded-md border border-destructive/40 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
            : "rounded-md border border-emerald-500/40 px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-500/10 disabled:opacity-50"
        }
      >
        {pending ? "…" : isActive ? "Disable" : "Enable"}
      </button>
      {error ? (
        <span className="text-[10px] text-destructive">{error}</span>
      ) : null}
    </div>
  );
}
