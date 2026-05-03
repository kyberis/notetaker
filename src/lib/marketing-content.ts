/**
 * Single source of truth for the public landing copy and the user-visible
 * changelog. Web is English-only; the bot pulls its strings from
 * `src/lib/i18n/dictionaries/`.
 *
 * Import this only from server components and route handlers.
 */

export const APP_NAME = "Will";
export const APP_TAGLINE = "Tell Will what you will.";
export const APP_DESCRIPTION =
  "A Telegram-first, open-source note-taking AI assistant. Send a message, a voice note, a photo, or a PDF — Will saves it, suggests tags, and pings you back when a reminder is due.";

export const HERO = {
  title: APP_TAGLINE,
  subtitle:
    "Will is a Telegram-first AI assistant for keeping a daily journal. Talk to it like a friend; it remembers everything, suggests tags, and pings you back when a reminder is due.",
  primaryCta: { label: "Get Will", href: "/register" },
  secondaryCta: { label: "Sign in", href: "/login" },
};

export const FEATURES = [
  {
    title: "Telegram-first",
    body:
      "Most usage happens in Telegram. Text, voice, photos, PDFs — Will normalises everything to a note. The web is just a calm daily journal you can scroll.",
  },
  {
    title: "Active reminders",
    body:
      "When a note has a date or time, Will offers to schedule a Telegram ping. A cron dispatches due reminders every minute — no missed birthdays.",
  },
  {
    title: "AI tagging",
    body:
      "Every new note triggers a one-tap tag suggestion: \"Want to tag this as #idea, #shopping, #reminder?\" Tap once or skip — your call.",
  },
  {
    title: "Multilingual",
    body:
      "Talk to Will in English, Spanish, Portuguese, or Arabic. The web stays English; the bot replies in your preferred language.",
  },
  {
    title: "Privacy-first",
    body:
      "GDPR-compliant. Soft-delete with 30-day grace, full data export, no third-party trackers. Your notes are yours.",
  },
  {
    title: "MIT, self-hostable",
    body:
      "Plain Next.js + Postgres. Run it on Vercel, Fly, Railway, or your own VPS. Optional integrations all degrade gracefully.",
  },
];

export const FAQ = [
  {
    q: "Why Telegram?",
    a: "Because the lowest-friction note-taking interface is the chat app you already have open. No new app icon. Voice, photos, PDFs all work out of the box.",
  },
  {
    q: "Where are my notes stored?",
    a: "In a single Postgres database that you control if you self-host, or on the production deploy at will.trefolio.com if you use the hosted version. We store no third-party telemetry.",
  },
  {
    q: "Which AI model do you use?",
    a: "By default, OpenAI's GPT-4o-mini via the Vercel AI Gateway, with Whisper for voice and the GPT-4o vision model for photos. You can override the chat model with AI_MODEL.",
  },
  {
    q: "Can I export everything?",
    a: "Yes. /api/account/export returns a single JSON file with all your notes, tags, reminders, and identity metadata. No export queue, no waiting.",
  },
  {
    q: "Can I delete my account?",
    a: "Yes — go to Settings → Delete account. We mark your account deleted immediately and hard-delete after 30 days. Sign back in within those 30 days to cancel.",
  },
  {
    q: "Is there a paid tier?",
    a: "Not in v1. Will is free and MIT-licensed. A small Pro tier may come later for higher daily quotas or longer voice notes.",
  },
];

/**
 * User-visible changelog. Add entries at the top. Keep them short, factual,
 * benefit-oriented. New version = bump the topmost block.
 */
export const CHANGELOG = [
  {
    version: "0.1.0",
    date: "2026-05-03",
    title: "First public release",
    highlights: [
      "Telegram-first note capture: text, voice, photo, PDF.",
      "AI tag suggestions on every new note.",
      "Active reminders dispatched via Vercel cron.",
      "English / Spanish / Portuguese / Arabic agent replies.",
      "Email + Google + passkey sign-in.",
      "Full GDPR baseline: export + 30-day soft-delete.",
    ],
  },
];
