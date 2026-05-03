"use client";

import {
  Bell,
  FileText,
  Image as ImageIcon,
  Mic,
  MessageSquare,
  Pencil,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { Locale } from "@/lib/i18n/locale";
import { toBcp47 } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

type Source = "TELEGRAM_TEXT" | "TELEGRAM_VOICE" | "TELEGRAM_PHOTO" | "TELEGRAM_PDF" | "WEB";

const SOURCE_ICON: Record<Source, React.ComponentType<{ className?: string }>> = {
  TELEGRAM_TEXT: MessageSquare,
  TELEGRAM_VOICE: Mic,
  TELEGRAM_PHOTO: ImageIcon,
  TELEGRAM_PDF: FileText,
  WEB: MessageSquare,
};

export type EditableNoteCardProps = {
  id: string;
  body: string;
  occurredAt: Date;
  source: Source;
  tags: string[];
  reminderAt?: Date | null;
  reminderStatus?: "PENDING" | "SENT" | "CANCELLED" | "FAILED" | null;
  locale: Locale;
};

export function EditableNoteCard(props: EditableNoteCardProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(props.body);
  const [tagsRaw, setTagsRaw] = useState(props.tags.join(", "));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const SourceIcon = SOURCE_ICON[props.source];
  const time = new Intl.DateTimeFormat(toBcp47(props.locale), {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(props.occurredAt);

  const cancel = () => {
    setBody(props.body);
    setTagsRaw(props.tags.join(", "));
    setError(null);
    setEditing(false);
  };

  const save = () => {
    const trimmed = body.trim();
    if (!trimmed) {
      setError("Note can't be empty.");
      return;
    }
    const tags = tagsRaw
      .split(/[,\s]+/)
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean)
      .slice(0, 10);

    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/notes/${encodeURIComponent(props.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: trimmed, tags }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setError(data.message ?? "Couldn't save the changes.");
        return;
      }
      setEditing(false);
      router.refresh();
    });
  };

  const remove = () => {
    if (!confirm("Delete this note? This can't be undone.")) return;
    startTransition(async () => {
      const res = await fetch(`/api/notes/${encodeURIComponent(props.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setError(data.message ?? "Couldn't delete the note.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <article className="rounded-lg border p-4">
      <header className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <SourceIcon className="h-3.5 w-3.5" />
          <span>{time}</span>
        </div>
        <div className="flex items-center gap-2">
          {props.reminderAt ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
                props.reminderStatus === "SENT" && "opacity-60",
                props.reminderStatus === "FAILED" &&
                  "text-destructive border-destructive",
              )}
            >
              <Bell className="h-3 w-3" />
              {new Intl.DateTimeFormat(toBcp47(props.locale), {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(props.reminderAt)}
            </span>
          ) : null}
          {!editing ? (
            <>
              <button
                type="button"
                aria-label="Edit note"
                onClick={() => setEditing(true)}
                disabled={pending}
                className="rounded p-1 hover:bg-secondary"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Delete note"
                onClick={remove}
                disabled={pending}
                className="rounded p-1 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                aria-label="Save changes"
                onClick={save}
                disabled={pending}
                className="rounded p-1 hover:bg-secondary"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Cancel edit"
                onClick={cancel}
                disabled={pending}
                className="rounded p-1 hover:bg-secondary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </header>

      {editing ? (
        <div className="mt-2 space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            maxLength={8000}
            disabled={pending}
            className="block w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="text"
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder="tags (comma-separated)"
            maxLength={200}
            disabled={pending}
            className="block w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      ) : (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
          {props.body}
        </p>
      )}

      {!editing && props.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {props.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
            >
              #{t}
            </span>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      ) : null}
    </article>
  );
}
