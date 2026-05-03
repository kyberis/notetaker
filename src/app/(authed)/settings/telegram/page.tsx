import Link from "next/link";

import { db } from "@/lib/db";
import { pageRequireAuth } from "@/lib/auth/session";

import { TelegramLinker } from "@/components/settings/telegram-linker";

export const dynamic = "force-dynamic";

export default async function TelegramSettingsPage() {
  const { user } = await pageRequireAuth();
  const fresh = await db.user.findUnique({
    where: { id: user.id },
    select: {
      telegramVerifiedAt: true,
      telegramUsername: true,
    },
  });
  const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? null;

  return (
    <div className="max-w-xl mx-auto">
      <Link href="/settings" className="text-xs text-muted-foreground underline">
        ← Settings
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Telegram</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Connect your Telegram account so Will can save your notes and ping you
        when reminders are due.
      </p>

      <div className="mt-8 rounded-lg border p-5 text-sm">
        {!botUsername ? (
          <p>
            This deployment doesn't have Telegram configured yet. Ask the
            administrator to set <code>TELEGRAM_BOT_USERNAME</code>.
          </p>
        ) : fresh?.telegramVerifiedAt ? (
          <div className="space-y-3">
            <p>
              Connected{" "}
              {fresh.telegramUsername ? (
                <>
                  as <code>@{fresh.telegramUsername}</code>
                </>
              ) : null}
              .
            </p>
            <TelegramLinker mode="reset" />
          </div>
        ) : (
          <TelegramLinker mode="link" />
        )}
      </div>
    </div>
  );
}
