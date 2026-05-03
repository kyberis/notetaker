import Image from "next/image";
import Link from "next/link";

import { APP_NAME } from "@/lib/marketing-content";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-[var(--parchment)]/80 backdrop-blur supports-[backdrop-filter]:bg-[var(--parchment)]/65">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="relative inline-flex size-10 items-center justify-center overflow-hidden rounded-xl shadow-sm ring-1 ring-[var(--gilt-deep)]/40">
              <Image
                src="/will-icon-192.png"
                alt=""
                width={192}
                height={192}
                priority
                className="block size-10 object-cover"
              />
            </span>
            <span className="display text-foreground text-2xl leading-none">
              {APP_NAME}
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/#features"
              className="hidden rounded-full px-3 py-1.5 text-foreground/70 transition-colors hover:bg-parchment-soft hover:text-foreground sm:inline-flex"
            >
              Features
            </Link>
            <Link
              href="/changelog"
              className="hidden rounded-full px-3 py-1.5 text-foreground/70 transition-colors hover:bg-parchment-soft hover:text-foreground sm:inline-flex"
            >
              Chronicle
            </Link>
            <Link
              href="/faq"
              className="hidden rounded-full px-3 py-1.5 text-foreground/70 transition-colors hover:bg-parchment-soft hover:text-foreground sm:inline-flex"
            >
              FAQ
            </Link>
            <Link
              href="/login"
              className="rounded-full px-3 py-1.5 text-foreground/70 transition-colors hover:bg-parchment-soft hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="ml-1 inline-flex h-9 items-center gap-1 rounded-full bg-foreground px-4 text-sm font-semibold text-background shadow-sm transition-colors hover:bg-foreground/90"
            >
              Get {APP_NAME}
              <span aria-hidden>→</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-12 border-t border-border/60 py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="display-italic">
            © {new Date().getFullYear()} {APP_NAME}, gent. · MIT licence.
          </span>
          <div className="flex flex-wrap gap-4">
            <Link href="/changelog" className="hover:text-foreground">
              Chronicle
            </Link>
            <Link href="/faq" className="hover:text-foreground">
              FAQ
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/contact" className="hover:text-foreground">
              Contact
            </Link>
            <a
              href="https://github.com/kyberis/notetaker"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
