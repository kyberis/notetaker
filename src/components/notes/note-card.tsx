import { Bell, FileText, Image as ImageIcon, Mic, MessageSquare } from "lucide-react";

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

export function NoteCard(props: {
  body: string;
  occurredAt: Date;
  source: Source;
  tags: string[];
  reminderAt?: Date | null;
  reminderStatus?: "PENDING" | "SENT" | "CANCELLED" | "FAILED" | null;
  locale: Locale;
}) {
  const SourceIcon = SOURCE_ICON[props.source];
  const time = new Intl.DateTimeFormat(toBcp47(props.locale), {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(props.occurredAt);

  return (
    <article className="rounded-lg border p-4">
      <header className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <SourceIcon className="h-3.5 w-3.5" />
          <span>{time}</span>
        </div>
        {props.reminderAt ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
              props.reminderStatus === "SENT" && "opacity-60",
              props.reminderStatus === "FAILED" && "text-destructive border-destructive",
            )}
          >
            <Bell className="h-3 w-3" />
            {new Intl.DateTimeFormat(toBcp47(props.locale), {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(props.reminderAt)}
          </span>
        ) : null}
      </header>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{props.body}</p>
      {props.tags.length > 0 ? (
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
    </article>
  );
}
