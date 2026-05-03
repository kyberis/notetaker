import Link from "next/link";

import { pageRequireAdmin } from "@/lib/auth/session";
import { listAdminUsers, type AdminUserRow } from "@/lib/admin/users";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Users · Admin · Will",
};

type SearchParams = {
  q?: string;
  telegram?: string;
  deleted?: string;
};

const PAGE_SIZE = 50;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  await pageRequireAdmin();
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim().slice(0, 200);
  const telegramOnly = sp.telegram === "1";
  const includeDeleted = sp.deleted === "1";

  const { users, total } = await listAdminUsers({
    q: q || undefined,
    telegramOnly,
    includeDeleted,
    limit: PAGE_SIZE,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            <Link href="/admin" className="hover:underline">
              Admin
            </Link>{" "}
            / Users
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total.toLocaleString("en-US")} match{total === 1 ? "" : "es"}
            {users.length < total ? ` (showing first ${users.length})` : ""}.
          </p>
        </div>
      </header>

      <form
        method="get"
        className="flex flex-wrap items-center gap-3 rounded-lg border p-3 text-sm"
      >
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by email or name…"
          className="min-w-0 flex-1 rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          maxLength={200}
        />
        <label className="inline-flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            name="telegram"
            value="1"
            defaultChecked={telegramOnly}
          />
          Telegram only
        </label>
        <label className="inline-flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            name="deleted"
            value="1"
            defaultChecked={includeDeleted}
          />
          Include deleted
        </label>
        <button
          type="submit"
          className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-secondary"
        >
          Apply
        </button>
        {(q || telegramOnly || includeDeleted) && (
          <Link
            href="/admin/users"
            className="text-xs text-muted-foreground underline"
          >
            Reset
          </Link>
        )}
      </form>

      {users.length === 0 ? (
        <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
          No users match the current filters.
        </div>
      ) : (
        <UsersTable rows={users} />
      )}
    </div>
  );
}

function UsersTable({ rows }: { rows: AdminUserRow[] }) {
  const dt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-medium">User</th>
            <th className="px-3 py-2 text-left font-medium">Locale</th>
            <th className="px-3 py-2 text-left font-medium">Telegram</th>
            <th className="px-3 py-2 text-right font-medium">Notes</th>
            <th className="px-3 py-2 text-right font-medium">Reminders</th>
            <th className="px-3 py-2 text-left font-medium">Last seen</th>
            <th className="px-3 py-2 text-left font-medium">Created</th>
            <th className="px-3 py-2 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id} className="border-t align-top">
              <td className="px-3 py-2">
                <div className="font-medium">{u.email}</div>
                {u.name ? (
                  <div className="text-xs text-muted-foreground">{u.name}</div>
                ) : null}
                {u.isAdmin ? (
                  <span className="mt-1 inline-block rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                    admin
                  </span>
                ) : null}
              </td>
              <td className="px-3 py-2 font-mono text-xs uppercase">
                {u.locale}
              </td>
              <td className="px-3 py-2">
                {u.telegramVerifiedAt ? (
                  <div className="space-y-0.5 text-xs">
                    <div>
                      {u.telegramUsername ? (
                        <code>@{u.telegramUsername}</code>
                      ) : (
                        <span className="text-muted-foreground">no handle</span>
                      )}
                    </div>
                    <div className="text-muted-foreground">
                      uid {u.telegramUserId ?? "—"}
                    </div>
                    <div className="text-muted-foreground">
                      chat {u.telegramChatId ?? "—"}
                    </div>
                    <div className="text-muted-foreground">
                      since {dt.format(u.telegramVerifiedAt)} UTC
                    </div>
                    {u.ttsEnabled ? (
                      <span className="inline-block rounded-full border px-1.5 py-0 text-[10px] uppercase">
                        tts
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {u.notesCount}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {u.remindersPending}
              </td>
              <td className="px-3 py-2 text-xs text-muted-foreground">
                {u.lastSeenAt ? `${dt.format(u.lastSeenAt)} UTC` : "—"}
              </td>
              <td className="px-3 py-2 text-xs text-muted-foreground">
                {dt.format(u.createdAt)} UTC
              </td>
              <td className="px-3 py-2">
                {u.deletedAt ? (
                  <span className="text-xs text-destructive">
                    deleted {dt.format(u.deletedAt)}
                  </span>
                ) : !u.isActive ? (
                  <span className="text-xs text-destructive">disabled</span>
                ) : !u.acceptedTermsAt ? (
                  <span className="text-xs text-muted-foreground">
                    pending terms
                  </span>
                ) : (
                  <span className="text-xs text-emerald-600">active</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
