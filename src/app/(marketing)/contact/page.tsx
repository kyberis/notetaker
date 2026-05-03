import type { Metadata } from "next";

import { ContactForm } from "@/components/contact-form";
import { breadcrumbJsonLd, buildMetadata, jsonLdScript } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description:
    "Get in touch with the Will team — bug reports, privacy requests, abuse reports, or general feedback.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-xl py-16">
      <script
        {...jsonLdScript(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
        )}
      />
      <h1 className="text-3xl font-semibold">Contact</h1>
      <p className="mt-2 text-muted-foreground">
        Bug, privacy request, abuse report, or just saying hi — drop a note
        below or email <code>hello@trefolio.com</code>.
      </p>
      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
