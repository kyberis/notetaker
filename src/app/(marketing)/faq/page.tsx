import type { Metadata } from "next";

import { FAQ } from "@/lib/marketing-content";
import {
  breadcrumbJsonLd,
  buildMetadata,
  faqJsonLd,
  jsonLdScript,
} from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "FAQ",
  description:
    "Frequently asked questions about Will — Telegram capture, AI models, privacy, exports, and self-hosting.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <article className="container mx-auto max-w-2xl py-16">
      <script
        {...jsonLdScript([
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
          faqJsonLd(FAQ.map(({ q, a }) => ({ question: q, answer: a }))),
        ])}
      />
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
