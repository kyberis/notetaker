/**
 * Single source of truth for the public landing copy and the user-visible
 * changelog. Web is English-only; the bot pulls its strings from
 * `src/lib/i18n/dictionaries/`.
 *
 * Voice: lightly bardic. Will's name is a Twelfth Night wink (the play's
 * subtitle is "Or, What You Will"), so the marketing copy plays with that
 * conceit — Folio typography, Renaissance flourishes, Shakespeare-tinged
 * phrasing — without sliding into pastiche.
 *
 * Import this only from server components and route handlers.
 */

export const APP_NAME = "Will";
export const APP_TAGLINE = "Tell Will. What you will.";
export const APP_DESCRIPTION =
  "A Telegram-first, open-source note-taking AI assistant. Speak, write, photograph, or forward a PDF — Will sets it down, suggests a tag in a single tap, and calls you back when the appointed hour comes.";

export const HERO = {
  title: APP_TAGLINE,
  subtitle:
    "Will is a Telegram-first AI scribe for keeping a daily journal. Talk to him as you would a trusted clerk; he remembers everything, suggests a tag, and pings you back when a reminder is due.",
  primaryCta: { label: "Get Will", href: "/register" },
  secondaryCta: { label: "Sign in", href: "/login" },
};

/**
 * Short paragraph used under the hero headline.
 */
export const HERO_PITCH =
  "Open Telegram. Speak, type, photograph, or forward a parchment of PDF — Will sets it down, offers a tag in a single tap, and calls you back when the appointed hour comes.";

/**
 * Used in the editorial pitch section under the hero. One paragraph that
 * argues why a chat-first journal is the lowest-friction way to remember
 * what you said you'd do.
 */
export const ELEVATOR_PITCH =
  "Most journals fail because the very act of opening them is a labour of its own. Will dwells where you already are — in your chat list — so capture happens in the few seconds before the thought escapes into the night.";

export const FEATURES: Array<{
  emoji: string;
  title: string;
  body: string;
}> = [
  {
    emoji: "✒️",
    title: "Telegram-first",
    body:
      "Most usage happens in Telegram. Text, voice, photos, PDFs — Will renders all of them down to a tidy note. The web is a calm folio you may scroll at leisure.",
  },
  {
    emoji: "🕰️",
    title: "Active reminders",
    body:
      "Where a note bears a date or hour, Will offers to set a Telegram bell. A cron rings the due reminders every minute — no birthdays forgotten, no farewells unsaid.",
  },
  {
    emoji: "🏷️",
    title: "AI tagging",
    body:
      "Each new note is met with a single-tap tag suggestion: \"Shall we mark this #idea, #shopping, or #reminder?\" One tap or skip — your choice.",
  },
  {
    emoji: "🌍",
    title: "Multilingual",
    body:
      "Speak to Will in English, Spanish, Portuguese, or Arabic. The web stays in the King's tongue; the bot answers in whatever you set.",
  },
  {
    emoji: "🔒",
    title: "Privacy-first",
    body:
      "GDPR-compliant. Soft-delete with a thirty-day grace, full data export, no third-party trackers in the wings. Your notes are yours.",
  },
  {
    emoji: "📜",
    title: "MIT, self-hostable",
    body:
      "Plain Next.js + Postgres beneath an MIT licence. Run him on Vercel, Fly, Railway, or your own bare-metal box. Optional integrations all bow gracefully when the env is bare.",
  },
];

export const FAQ = [
  {
    q: "Why Telegram?",
    a: "Because the lowest-friction note-taking interface is the chat app you already have open. No new app icon. Voice, photos, and PDFs all work out of the box.",
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
    a: "Aye. /api/account/export returns a single JSON file with all your notes, tags, reminders, and identity metadata. No export queue, no waiting.",
  },
  {
    q: "Can I delete my account?",
    a: "Aye — go to Settings → Delete account. We mark your account deleted immediately and hard-delete after thirty days. Sign back in within those thirty days to cancel.",
  },
  {
    q: "Is there a paid tier?",
    a: "Not in v1. Will is free and MIT-licensed. A small Pro tier may come later for higher daily quotas or longer voice notes.",
  },
];

/**
 * Editorial copy used by the rich landing page. Kept here (rather than
 * inline in the page component) so non-engineers can edit copy without
 * touching JSX, and so SEO helpers can read it.
 */
export const LANDING_COPY = {
  metaTitle: "Will — Tell Will. What you will.",
  metaDescription:
    "Telegram-first, open-source note-taking AI scribe. Capture text, voice, photos, and PDFs in a chat; Will tags them, summarises them, and calls you back when a reminder is due.",
  chip: "Or, what you will",
  titleLine1: "Tell Will.",
  titleLine2Pre: "What you ",
  titleLine2Highlight: "will.",
  ctaPrimary: "Get Will on Telegram",
  ctaSecondary: "Read the prologue",
  badgeFree: "Free forever",
  badgeOpenSource: "MIT licensed",
  badgeSelfHosted: "Self-hostable",

  // Hero Telegram preview ----------------------------------------------------
  previewBotHandle: "@willbot",
  previewBotStatus: "On stage · ready",
  previewBotChip: "Notes. Tags. Bells.",
  previewUser1: "🎙️ 0:18 voice note",
  previewWillBody:
    "Set down. Shall we tag it #health, #appointment, or skip the matter?",
  previewWillTagOne: "#health",
  previewWillTagTwo: "#appointment",
  previewWillReminderLabel: "Bell at",
  previewWillReminderValue: "Friday · 10:00",
  previewUser2: "Both. And ring me.",
  previewFloatingLabel: "Note set down",
  previewFloatingMeta: "1 tag · 1 bell",
  previewFloatingSticker: "On time",

  // Meet Will (Dramatis Personae) -------------------------------------------
  personaSticker: "Dramatis personae",
  personaName: "Will, of Telegram",
  personaTitle: "Notetaker, scribe, and timely whisperer.",
  personaQuote:
    "“Some are born great, some achieve greatness, and some have greatness thrust upon them.” — Twelfth Night, II.v",
  personaBody:
    "A quill in your chat list. He keeps your hours, ledger, and idle thoughts; tags them, summons them when called, and never tells the patrons. Named, not idly, after the Bard's own private rhyme on the word will.",
  personaMetaName: "William ‘Will’ Bot",
  personaMetaEst: "Anno Domini",
  personaMetaEstValue: "MMXXVI",
  personaMetaLicence: "Licence",
  personaMetaLicenceValue: "MIT",
  personaMetaHome: "Stage",
  personaMetaHomeValue: "Telegram & web",
  personaCardCaption: "Printer's mark · Will Bot, gent.",

  // What Will keeps (capability tiles) --------------------------------------
  capabilityHeading: "What Will keeps",
  capabilityVoiceLabel: "Voice notes",
  capabilityVoiceBody: "Whisper transcribes; Will preserves the audio.",
  capabilityPhotoLabel: "Photo capture",
  capabilityPhotoBody: "GPT-4o vision captions whiteboards and pages.",
  capabilityPdfLabel: "PDF imports",
  capabilityPdfBody: "Forward a parchment; Will extracts a note + summary.",
  capabilityRemindLabel: "Active bells",
  capabilityRemindBody: "A cron rings you back when the hour is due.",

  // Editorial pitch ----------------------------------------------------------
  pitchSticker: "Why a chat-first journal",
  pitchTitlePart1: "A journal in the ",
  pitchTitleHighlight: "chat",
  pitchTitlePart2: " you already have open.",
  pitchExtra:
    "No new icon to install upon thy device. No daily-streak guilt to keep. Will is a quiet bot that listens, files, and reminds — and a calm web folio when you wish to read it back.",

  // Self-host callout (mirrors Clara's MCP block) ---------------------------
  selfHostSticker: "Open source",
  selfHostTitlePart1: "Bring your own bot. ",
  selfHostTitleHighlight: "Host your own folio",
  selfHostTitlePart2: ".",
  selfHostBody:
    "Will is plain Next.js + Postgres beneath an MIT licence. Run him on Vercel, Fly, Railway, or your own bare-metal box. Optional integrations (Telegram, Resend, Upstash, Blob, Turnstile) all bow gracefully when env vars are missing.",
  selfHostHowTo: "How to self-host",
  selfHostGitHub: "View on GitHub",
  selfHostSnippetComment: "# clone the folio, point at thy database",

  // Editorial quote / rule ---------------------------------------------------
  ruleSticker: "House rule",
  ruleTitlePart1: "Frictionless capture beats ",
  ruleTitleHighlight: "clever organisation",
  ruleTitlePart2: ".",
  ruleBody:
    "Get the thought out of thy head and into the chat. Tags, summaries, and bells are added afterwards by Will — never the price of admission to the journal.",

  // Final CTA ----------------------------------------------------------------
  finalTitlePart1: "Begin thy ",
  finalTitleHighlight: "chronicle",
  finalTitlePart2: ".",
  finalBody:
    "Sign up with email, Google, or a passkey. Connect Telegram in two taps. Send Will thy first note in the next thirty seconds — what you will.",
  finalRegister: "Get Will",
  finalFaq: "Read the FAQ",
} as const;

/**
 * User-visible changelog. Add entries at the top. Keep them short, factual,
 * benefit-oriented. New version = bump the topmost block.
 */
export const CHANGELOG = [
  {
    version: "0.7.0",
    date: "2026-05-05",
    title: "Unified sign-in at user.trefolio.com",
    highlights: [
      "When unified accounts are enabled (USE_LEGACY_AUTH=false), /login and /register send you straight to the shared IdP — same email and plan as trefolio and Clara.",
      "On Vercel production, the app ignores a mistaken IDP_BASE_URL pointing at localhost and uses https://user.trefolio.com instead.",
    ],
  },
  {
    version: "0.6.0",
    date: "2026-05-04",
    title: "Admin can disable accounts",
    highlights: [
      "Administrators can now disable a user from /admin/users with a single click. Disabled accounts are signed out on their next request and their Telegram messages are silently dropped until re-enabled.",
      "Disabled users see a dedicated \"Your account has been disabled\" notice on the sign-in screen instead of a generic error.",
      "Admins cannot disable their own account — keeps you from locking yourself out of the console.",
    ],
  },
  {
    version: "0.5.0",
    date: "2026-05-04",
    title: "Live progress in Telegram",
    highlights: [
      "Will now narrates each step inside Telegram — \"Saving your note…\", \"Suggesting tags…\", \"Scheduling a reminder…\" — so you see the work happening rather than a silent typing dot.",
      "The status line is edited in place and disappears the moment the final reply arrives, keeping the chat tidy.",
      "Localised across English, Spanish, Portuguese and Arabic.",
    ],
  },
  {
    version: "0.4.0",
    date: "2026-05-03",
    title: "Web notes, edit anywhere, admin console",
    highlights: [
      "Capture notes from the web — quick-add box on the dashboard, ⌘/Ctrl + Enter to save, optional tags.",
      "Edit and delete notes inline on the web, or ask Will on Telegram (\"fix the typo\", \"remove tag X\").",
      "Bardic + rioplatense voice for the Telegram bot, with proper bold / italic rendering instead of literal asterisks.",
      "Admin console at /admin for the team — overview metrics plus a searchable user list with Telegram link status.",
    ],
  },
  {
    version: "0.3.0",
    date: "2026-05-03",
    title: "First Folio",
    highlights: [
      "Reskinned the home page in a Shakespeare-Folio idiom: parchment, gilt, ink, fleuron dividers, drop-cap pitch.",
      "Added a “Dramatis personae” portrait section featuring the Will icon as the printer's mark.",
      "Cormorant Garamond + EB Garamond replace the previous display + sans pairing.",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-05-03",
    title: "Editorial home & changelog page",
    highlights: [
      "Redesigned landing page in Will's editorial style.",
      "Added a public /changelog page so what's new has a permanent home.",
      "New display typography across the marketing site.",
    ],
  },
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
