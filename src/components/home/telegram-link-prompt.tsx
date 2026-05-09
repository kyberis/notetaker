import Link from "next/link";

import { TelegramLinker } from "@/components/settings/telegram-linker";

/**
 * Shown on /app when the bot is configured and the user has not linked Telegram yet.
 */
export function TelegramLinkPrompt() {
  return (
    <section
      aria-labelledby="telegram-link-heading"
      className="rounded-lg border border-primary/25 bg-secondary/50 p-5"
    >
      <h2 id="telegram-link-heading" className="text-base font-semibold">
        Link Telegram
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Will&apos;s main surface is chat — link your account to capture by message,
        voice, photo, or PDF, and get reminder pings there.
      </p>
      <div className="mt-4">
        <TelegramLinker mode="link" />
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        <Link href="/settings/telegram" className="underline">
          Open Telegram settings
        </Link>{" "}
        for the full page.
      </p>
    </section>
  );
}
