import type { Metadata } from "next";
import Link from "next/link";

import { CHANGELOG } from "@/lib/marketing-content";
import {
  breadcrumbJsonLd,
  buildMetadata,
  jsonLdScript,
} from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Changelog",
  description:
    "Public release notes for Will — what's new, improved, and fixed in each version.",
  path: "/changelog",
});

const STICKER_VARIANTS = [
  "sticker-gilt",
  "sticker-ivy",
  "sticker-wax",
  "sticker-plum",
] as const;

export default function ChangelogPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <script
        {...jsonLdScript([
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Changelog", path: "/changelog" },
          ]),
        ])}
      />

      <header className="mb-12 space-y-4 text-center">
        <div className="fleuron mx-auto w-40" aria-hidden />
        <span className="sticker sticker-gilt">What&rsquo;s new</span>
        <h1 className="display text-foreground text-4xl leading-tight sm:text-5xl">
          Will{" "}
          <span className="hl hl-ivy">chronicle</span>
        </h1>
        <p className="display-italic text-foreground/85 mx-auto max-w-xl text-lg leading-relaxed">
          Quiet, factual notes about what shipped. The newest release sits on
          top.
        </p>
      </header>

      <ol className="space-y-6">
        {CHANGELOG.map((entry, idx) => {
          const variant = STICKER_VARIANTS[idx % STICKER_VARIANTS.length];
          return (
            <li key={entry.version} className="surface-card p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`sticker ${variant}`}>v{entry.version}</span>
                <time
                  dateTime={entry.date}
                  className="text-muted-foreground text-xs tracking-wide uppercase"
                >
                  {entry.date}
                </time>
              </div>
              <h2 className="display text-foreground mt-3 text-2xl leading-snug sm:text-3xl">
                {entry.title}
              </h2>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-foreground/80 sm:text-base">
                {entry.highlights.map((h) => (
                  <li key={h} className="flex gap-3">
                    <span
                      aria-hidden
                      className="mt-2 inline-block size-1.5 shrink-0 rounded-full bg-[var(--gilt-deep)]"
                    />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>

      <div className="mt-12 text-center">
        <Link
          href="/"
          className="text-foreground/70 hover:text-foreground inline-flex items-center gap-1 text-sm font-medium"
        >
          <span aria-hidden>←</span>
          Back to home
        </Link>
      </div>
    </article>
  );
}
