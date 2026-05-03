import Link from "next/link";

import { APP_NAME } from "@/lib/marketing-content";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">
            {APP_NAME}
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/faq" className="hover:text-foreground">FAQ</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/login" className="hover:text-foreground">Sign in</Link>
            <Link
              href="/register"
              className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground"
            >
              Get Will
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t">
        <div className="container mx-auto flex h-14 items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} {APP_NAME}. MIT licence.</span>
          <div className="flex gap-3">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/contact">Contact</Link>
            <a href="https://github.com/kyberis/notetaker" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
