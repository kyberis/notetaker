"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TelegramLinker({ mode }: { mode: "link" | "reset" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onGenerate() {
    setPending(true);
    setError(null);
    const res = await fetch("/api/settings/telegram", { method: "POST" });
    setPending(false);
    if (res.ok) {
      const json = (await res.json()) as { url: string };
      setLink(json.url);
    } else {
      const json = (await res.json().catch(() => ({}))) as { message?: string };
      setError(json.message ?? "Couldn't generate a link.");
    }
  }

  async function onUnlink() {
    setPending(true);
    setError(null);
    const res = await fetch("/api/settings/telegram", { method: "DELETE" });
    setPending(false);
    if (res.ok) router.refresh();
    else setError("Couldn't unlink.");
  }

  if (mode === "reset") {
    return (
      <div className="space-y-2">
        <button
          onClick={onUnlink}
          disabled={pending}
          className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
        >
          Disconnect Telegram
        </button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p>
        Step 1: tap the button below to generate a one-time link. Step 2: open
        the link in Telegram and press <strong>Start</strong>. Step 3: come
        back here — the page will say "Connected".
      </p>
      <button
        onClick={onGenerate}
        disabled={pending}
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Generating..." : "Generate link"}
      </button>
      {link ? (
        <p className="text-sm">
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Open Will on Telegram →
          </a>{" "}
          (link expires in 15 minutes)
        </p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
