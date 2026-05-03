/**
 * English bot dictionary. The web UI is English-only and uses these strings
 * directly; other locales mirror this shape.
 */
export type BotDictionary = {
  bot: {
    welcome: string;
    linked: string;
    linkExpired: string;
    notLinked: string;
    quotaExceeded: (limit: number) => string;
    saved: string;
    savedWithReminder: (when: string) => string;
    tagPrompt: string;
    tagApplied: (tags: string[]) => string;
    tagSkipped: string;
    reminderConfirm: (when: string) => string;
    reminderFired: (body: string) => string;
    listEmpty: string;
    listHeader: (count: number, range: string) => string;
    deleted: string;
    error: string;
    languageChanged: (label: string) => string;
    voiceTooLong: string;
    photoFailed: string;
    pdfFailed: string;
  };
  buttons: {
    yes: string;
    no: string;
    skip: string;
  };
};

export const en: BotDictionary = {
  bot: {
    welcome:
      "Greetings, milord. I am Will, your scribe. Send me a message — text, voice, photo, or PDF — and I'll set it down. I keep reminders too.",
    linked: "Telegram linked, milord. Send me anything and I'll keep it for you.",
    linkExpired:
      "That link hath expired. Open Will on the web and forge a fresh one from /settings/telegram.",
    notLinked:
      "I do not know this Telegram account, traveller. Open Will on the web, go to /settings/telegram, and paste the link to connect.",
    quotaExceeded: (limit) =>
      `You've hit today's limit of ${limit} messages, milord. It resets at 00:00 UTC.`,
    saved: "Noted.",
    savedWithReminder: (when) => `Noted. I'll call upon you on ${when}.`,
    tagPrompt: "Shall we tag this one?",
    tagApplied: (tags) => `Tagged: ${tags.map((t) => `#${t}`).join(" ")}`,
    tagSkipped: "No tags. Got it.",
    reminderConfirm: (when) => `Reminder set for ${when}. Wouldst thou change it?`,
    reminderFired: (body) => `Reminder: ${body}`,
    listEmpty: "The page is yet blank, milord. Send me anything and we'll begin.",
    listHeader: (count, range) =>
      `Last ${count} note${count === 1 ? "" : "s"} ${range}:`,
    deleted: "Note struck from the page.",
    error: "Something went amiss. Try again?",
    languageChanged: (label) => `Got it — I'll reply in ${label} from now on.`,
    voiceTooLong: "That voice note is too long, milord. Keep it under 10 minutes.",
    photoFailed: "I couldn't decipher that image. Send the text instead?",
    pdfFailed:
      "I couldn't read that PDF. Send a smaller file or paste the text?",
  },
  buttons: {
    yes: "Yes",
    no: "No",
    skip: "Skip",
  },
};
