"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n/locale";

export function LocalePicker({ current }: { current: Locale }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const locale = e.target.value;
    setPending(true);
    setError(null);
    const res = await fetch("/api/settings/locale", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale }),
    });
    setPending(false);
    if (res.ok) router.refresh();
    else setError("Couldn't save.");
  }

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={current}
        onChange={onChange}
        disabled={pending}
        className="rounded-md border bg-background px-3 py-2 text-sm"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
      {error ? <span className="text-sm text-destructive">{error}</span> : null}
    </div>
  );
}
