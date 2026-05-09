import Link from "next/link";

import { db } from "@/lib/db";
import { LOCALE_LABELS, isLocale, type Locale } from "@/lib/i18n/locale";
import { pageRequireAuth } from "@/lib/auth/session";
import { buildIdpAccountUrlForWill, shouldSendUsersToUnifiedIdp } from "@/lib/idp-base";

import { LocalePicker } from "@/components/settings/locale-picker";
import { ExportAccountButton } from "@/components/settings/export-button";
import { DeleteAccountSection } from "@/components/settings/delete-section";

export default async function SettingsPage() {
  const { user } = await pageRequireAuth();
  const unifiedAccountUrl =
    shouldSendUsersToUnifiedIdp() ? buildIdpAccountUrlForWill() : null;
  const fresh = await db.user.findUnique({
    where: { id: user.id },
    select: { locale: true, telegramVerifiedAt: true, telegramUsername: true, ttsEnabled: true },
  });
  const locale: Locale = isLocale(fresh?.locale) ? fresh.locale : "en";

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <section>
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Account
        </h2>
        <div className="mt-3 rounded-lg border p-4 text-sm space-y-3">
          <p>
            Signed in as <strong>{user.email}</strong>.
          </p>
          {unifiedAccountUrl ? (
            <>
              <p className="text-muted-foreground">
                Display name, password, Google, passkeys, and billing are managed on your
                unified trefolio account (same login as trefolio and Clara).
              </p>
              <a
                href={unifiedAccountUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block font-medium underline"
              >
                Open unified account at user.trefolio.com
              </a>
            </>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Language
        </h2>
        <div className="mt-3 rounded-lg border p-4 text-sm">
          <p className="mb-3">
            Will replies in your preferred language. Currently:{" "}
            <strong>{LOCALE_LABELS[locale]}</strong>.
          </p>
          <LocalePicker current={locale} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Telegram
        </h2>
        <div className="mt-3 rounded-lg border p-4 text-sm">
          {fresh?.telegramVerifiedAt ? (
            <p>
              Connected{" "}
              {fresh.telegramUsername ? (
                <>
                  as <code>@{fresh.telegramUsername}</code>
                </>
              ) : null}
              .
            </p>
          ) : (
            <p>Not connected.</p>
          )}
          <Link href="/settings/telegram" className="mt-3 inline-block underline">
            Manage
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Your data
        </h2>
        <div className="mt-3 rounded-lg border p-4 text-sm space-y-3">
          <p>
            Export everything we store about you as a JSON file — notes, tags,
            reminders, identity metadata.
          </p>
          <ExportAccountButton />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wide text-destructive">
          Danger zone
        </h2>
        <div className="mt-3 rounded-lg border border-destructive/40 p-4 text-sm">
          <DeleteAccountSection />
        </div>
      </section>
    </div>
  );
}
