import { redirect } from "next/navigation";
import Link from "next/link";

import { pageRequireAuth } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/marketing-content";

import { SignOutButton } from "@/components/auth/signout-button";
import { AgentQuotaBadge } from "@/components/agent-quota-badge";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { needsTerms, user } = await pageRequireAuth();
  if (needsTerms) redirect("/accept-terms");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between">
          <Link href="/app" className="font-semibold tracking-tight">
            {APP_NAME}
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/app" className="hover:text-foreground">Notes</Link>
            <Link href="/settings" className="hover:text-foreground">Settings</Link>
            {user.isAdmin ? (
              <Link href="/admin" className="hover:text-foreground">
                Admin
              </Link>
            ) : null}
            <AgentQuotaBadge />
            <span className="text-xs">{user.email}</span>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto py-8">{children}</main>
    </div>
  );
}
