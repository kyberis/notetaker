import type { Metadata } from "next";

import { APP_NAME } from "@/lib/marketing-content";
import { ACCOUNT_DELETION_GRACE_DAYS, CURRENT_TERMS_VERSION } from "@/lib/legal";
import { breadcrumbJsonLd, buildMetadata, jsonLdScript } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Privacy",
  description: `How ${APP_NAME} handles your data. GDPR-aligned: minimal collection, soft-delete, full export.`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <article className="container mx-auto max-w-2xl py-16 prose dark:prose-invert">
      <script
        {...jsonLdScript(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Privacy", path: "/privacy" },
          ]),
        )}
      />
      <h1>Privacy</h1>
      <p className="lead">
        Last updated: {new Date().toISOString().slice(0, 10)} · Version{" "}
        {CURRENT_TERMS_VERSION}
      </p>

      <h2>Who we are</h2>
      <p>
        Will is operated by trefolio.com. The data controller for hosted users
        on <code>will.trefolio.com</code> is the maintainer at{" "}
        <code>privacy@trefolio.com</code>.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Identity:</strong> email, optional display name, optional
          Google profile metadata if you sign in with Google, and the
          credential public key for any passkey you register.
        </li>
        <li>
          <strong>Telegram link:</strong> your Telegram user id and chat id
          (numeric), plus your Telegram username if visible. We use this only
          to route messages between Will and you.
        </li>
        <li>
          <strong>Note content:</strong> exactly what you send Will — text,
          transcribed voice, OCR'd images, extracted PDF text, plus the tags
          and reminders you accept.
        </li>
        <li>
          <strong>Operational metadata:</strong> the daily counter we use to
          enforce per-user agent quotas. Aggregated; never sold.
        </li>
      </ul>

      <h2>What we don't collect</h2>
      <ul>
        <li>No third-party trackers. No analytics scripts on the public web.</li>
        <li>No advertising identifiers. No cross-site cookies.</li>
        <li>No location, contacts, or device sensors.</li>
      </ul>

      <h2>Sub-processors</h2>
      <p>The hosted version uses the following processors:</p>
      <ul>
        <li>
          <strong>Vercel</strong> (deployment + edge cron + Blob storage for TTS
          audio).
        </li>
        <li>
          <strong>Neon</strong> (managed PostgreSQL — primary database).
        </li>
        <li>
          <strong>OpenAI</strong> (chat, vision, Whisper transcription, TTS).
          Calls go via Vercel AI Gateway when configured. OpenAI's zero-data-
          retention policy applies.
        </li>
        <li>
          <strong>Telegram</strong> (Bot API for chat).
        </li>
        <li>
          <strong>Resend</strong> (transactional email — verification + reminders fallback).
        </li>
        <li>
          <strong>Upstash Redis</strong> (rate limiting).
        </li>
        <li>
          <strong>Cloudflare Turnstile</strong> (signup captcha).
        </li>
      </ul>

      <h2>Lawful basis</h2>
      <p>
        Performance of contract (Art. 6(1)(b)) for everything that makes Will
        work. Legitimate interest (Art. 6(1)(f)) for abuse mitigation
        (Turnstile, rate limits, deletion-warning emails). Consent
        (Art. 6(1)(a)) for optional features like text-to-speech replies.
      </p>

      <h2>Retention</h2>
      <ul>
        <li>
          Notes, tags, reminders: kept until you delete them. Account
          deletion soft-deletes for {ACCOUNT_DELETION_GRACE_DAYS} days, then
          hard-deletes everything.
        </li>
        <li>Verification-token JTIs: kept until natural expiry (24h).</li>
        <li>
          Contact-form metadata (IP, user-agent): purged after 90 days.
        </li>
      </ul>

      <h2>Your rights</h2>
      <ul>
        <li>
          <strong>Access / portability:</strong>{" "}
          <code>GET /api/account/export</code> returns everything we store
          about you as a single JSON file.
        </li>
        <li>
          <strong>Deletion:</strong> Settings → Delete account. Soft-deleted
          immediately, hard-deleted after {ACCOUNT_DELETION_GRACE_DAYS} days.
          Sign back in within the grace window to cancel.
        </li>
        <li>
          <strong>Rectification / objection:</strong> email{" "}
          <code>privacy@trefolio.com</code>.
        </li>
        <li>
          You can lodge a complaint with your national data-protection
          authority.
        </li>
      </ul>

      <h2>Data transfers</h2>
      <p>
        Some sub-processors operate outside the EU/EEA (e.g. OpenAI in the
        US). Transfers rely on Standard Contractual Clauses or equivalent
        safeguards. Self-hosting bypasses third-party hosting entirely.
      </p>
    </article>
  );
}
