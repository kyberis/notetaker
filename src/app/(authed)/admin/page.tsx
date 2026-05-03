import Link from "next/link";

import { pageRequireAdmin } from "@/lib/auth/session";
import { getAdminMetrics } from "@/lib/admin/users";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin · Will",
};

export default async function AdminHome() {
  await pageRequireAdmin();
  const metrics = await getAdminMetrics();

  const cards: Array<{ label: string; value: number; hint?: string }> = [
    { label: "Users", value: metrics.totalUsers, hint: `${metrics.activeUsers} active` },
    {
      label: "Telegram linked",
      value: metrics.telegramLinkedUsers,
      hint:
        metrics.totalUsers > 0
          ? `${Math.round((metrics.telegramLinkedUsers / metrics.totalUsers) * 100)}% of users`
          : undefined,
    },
    { label: "Notes", value: metrics.totalNotes },
    { label: "Reminders pending", value: metrics.remindersPending },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Operational overview. Internal only.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {c.label}
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">
              {c.value.toLocaleString("en-US")}
            </div>
            {c.hint ? (
              <div className="mt-1 text-xs text-muted-foreground">{c.hint}</div>
            ) : null}
          </div>
        ))}
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Sections
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <Link href="/admin/users" className="underline">
              Users
            </Link>{" "}
            <span className="text-muted-foreground">
              — list, search, see Telegram links
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}
