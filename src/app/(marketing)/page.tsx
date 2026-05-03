import Link from "next/link";

import { CHANGELOG, FEATURES, HERO } from "@/lib/marketing-content";

export default function Home() {
  return (
    <>
      <section className="container mx-auto py-20 md:py-28 max-w-3xl text-center">
        <h1 className="text-4xl md:text-6xl font-serif tracking-tight leading-tight">
          {HERO.title}
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">{HERO.subtitle}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href={HERO.primaryCta.href}
            className="rounded-md bg-primary px-5 py-2.5 text-primary-foreground"
          >
            {HERO.primaryCta.label}
          </Link>
          <Link
            href={HERO.secondaryCta.href}
            className="rounded-md border px-5 py-2.5"
          >
            {HERO.secondaryCta.label}
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Free. Open source. MIT-licensed. Self-hostable.
        </p>
      </section>

      <section className="container mx-auto pb-16 max-w-5xl">
        <div className="grid gap-6 md:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-lg border p-6">
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto pb-24 max-w-3xl">
        <h2 className="font-semibold mb-3">What's new</h2>
        <ul className="space-y-3">
          {CHANGELOG.map((c) => (
            <li key={c.version} className="rounded-lg border p-5">
              <div className="flex items-baseline justify-between">
                <span className="font-medium">{c.title}</span>
                <span className="text-xs text-muted-foreground">
                  v{c.version} · {c.date}
                </span>
              </div>
              <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
                {c.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
