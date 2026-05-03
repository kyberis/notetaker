"use client";

import { useState } from "react";

export function ContactForm() {
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");
    setError(null);
    const data = new FormData(e.currentTarget);
    const payload = {
      kind: data.get("kind"),
      name: data.get("name"),
      email: data.get("email"),
      body: data.get("body"),
    };
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setState("ok");
    } else {
      const json = (await res.json().catch(() => ({}))) as { message?: string };
      setError(json.message ?? "Something went wrong.");
      setState("error");
    }
  }

  if (state === "ok") {
    return <p className="rounded-md border p-4">Thanks — we'll get back to you.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium" htmlFor="kind">Kind</label>
        <select
          id="kind"
          name="kind"
          defaultValue="GENERAL"
          className="mt-1 w-full rounded-md border bg-background px-3 py-2"
        >
          <option value="GENERAL">General</option>
          <option value="BUG">Bug</option>
          <option value="PRIVACY">Privacy / GDPR</option>
          <option value="ABUSE">Abuse</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          required
          className="mt-1 w-full rounded-md border bg-background px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-md border bg-background px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="body">Message</label>
        <textarea
          id="body"
          name="body"
          required
          minLength={10}
          rows={5}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2"
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <button
        type="submit"
        disabled={state === "loading"}
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
      >
        {state === "loading" ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
