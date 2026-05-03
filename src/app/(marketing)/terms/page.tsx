import type { Metadata } from "next";

import { APP_NAME } from "@/lib/marketing-content";
import { CURRENT_TERMS_VERSION } from "@/lib/legal";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <article className="container mx-auto max-w-2xl py-16 prose dark:prose-invert">
      <h1>Terms of service</h1>
      <p className="lead">
        Last updated: {new Date().toISOString().slice(0, 10)} · Version{" "}
        {CURRENT_TERMS_VERSION}
      </p>

      <h2>Plain English summary</h2>
      <ul>
        <li>{APP_NAME} is provided "as is" under the MIT licence.</li>
        <li>You own your notes. You can export and delete them at any time.</li>
        <li>Don't use Will for anything illegal, abusive, or harassing.</li>
        <li>We may suspend accounts that abuse the service or our infrastructure.</li>
        <li>Will is not a backup. Keep your own copy of anything important.</li>
      </ul>

      <h2>Service</h2>
      <p>
        {APP_NAME} accepts notes you send via Telegram or the web and keeps
        them in a Postgres database under our control (or yours, if you
        self-host). The hosted version may go down for maintenance without
        notice.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Don't send Will content that violates law in your jurisdiction or
        ours. Don't try to extract third-party personal data, run abuse
        campaigns, or attack the bot. We reserve the right to suspend
        accounts that breach these rules.
      </p>

      <h2>AI output</h2>
      <p>
        Will uses third-party AI models. Outputs may be wrong, biased, or
        hallucinated. Don't rely on Will for legal, medical, or financial
        decisions. Always verify reminders before acting on them.
      </p>

      <h2>Liability</h2>
      <p>
        To the fullest extent allowed by law, the maintainers are not liable
        for indirect, incidental, or consequential damages arising from your
        use of Will, including missed reminders, lost notes, or service
        outages.
      </p>

      <h2>Changes</h2>
      <p>
        We'll update the version above when we change the terms in a way
        that affects you. Continued use after a version bump means you
        accept the new version; the app will ask you to re-accept on the
        next sign-in.
      </p>
    </article>
  );
}
