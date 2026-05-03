import type { Metadata } from "next";

import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-xl py-16">
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
