import type { Metadata } from "next";

import { FAQ } from "@/lib/marketing-content";

export const metadata: Metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <article className="container mx-auto max-w-2xl py-16">
      <h1 className="text-3xl font-semibold">FAQ</h1>
      <dl className="mt-8 space-y-6">
        {FAQ.map((q) => (
          <div key={q.q}>
            <dt className="font-medium">{q.q}</dt>
            <dd className="mt-1 text-muted-foreground">{q.a}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
