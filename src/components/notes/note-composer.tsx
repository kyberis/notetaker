"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/**
 * Quick-add box on the notes page. POSTs to /api/notes with `source: "WEB"`
 * (set server-side) and refreshes the page so the new note appears in the
 * day-grouped list. Tags are typed as a comma-separated string for speed —
 * we let the server normalise them (lowercase, no "#", no spaces).
 */
export function NoteComposer() {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    const trimmed = body.trim();
    if (!trimmed) {
      setError("Write something first.");
      return;
    }
    setError(null);
    const tags = tagsRaw
      .split(/[,\s]+/)
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean)
      .slice(0, 10);

    startTransition(async () => {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: trimmed, tags: tags.length ? tags : undefined }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setError(data.message ?? "Couldn't save the note.");
        return;
      }
      setBody("");
      setTagsRaw("");
      router.refresh();
    });
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        New note
      </label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        rows={3}
        maxLength={8000}
        placeholder="What's on your mind? (⌘/Ctrl + Enter to save)"
        className="mt-2 block w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        disabled={pending}
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={tagsRaw}
          onChange={(e) => setTagsRaw(e.target.value)}
          placeholder="tags (comma-separated, optional)"
          className="min-w-0 flex-1 rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          maxLength={200}
          disabled={pending}
        />
        <button
          type="button"
          onClick={submit}
          disabled={pending || body.trim().length === 0}
          className="rounded-md border bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
