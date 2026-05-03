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
      "Hi, I'm Will. Send me a message — text, voice, photo, or PDF — and I'll save it as a note. I can also schedule reminders.",
    linked: "Telegram linked. Send me anything and I'll keep it for you.",
    linkExpired:
      "That link expired. Open Will on the web and generate a fresh one from /settings/telegram.",
    notLinked:
      "I don't recognise this Telegram account. Open Will on the web, go to /settings/telegram, and paste the link to connect.",
    quotaExceeded: (limit) =>
      `You've hit today's limit of ${limit} messages. It resets at 00:00 UTC.`,
    saved: "Saved.",
    savedWithReminder: (when) => `Saved. I'll ping you on ${when}.`,
    tagPrompt: "Want to tag this note?",
    tagApplied: (tags) => `Tagged: ${tags.map((t) => `#${t}`).join(" ")}`,
    tagSkipped: "No tags. Got it.",
    reminderConfirm: (when) => `Reminder set for ${when}. Want to change it?`,
    reminderFired: (body) => `Reminder: ${body}`,
    listEmpty: "No notes yet. Send me anything and I'll start your journal.",
    listHeader: (count, range) =>
      `Last ${count} note${count === 1 ? "" : "s"} ${range}:`,
    deleted: "Note deleted.",
    error: "Something went wrong. Try again?",
    languageChanged: (label) => `Got it — I'll reply in ${label} from now on.`,
    voiceTooLong: "That voice note is too long. Keep it under 10 minutes.",
    photoFailed: "I couldn't read that image. Send the text instead?",
    pdfFailed:
      "I couldn't read that PDF. Send a smaller file or paste the text?",
  },
  buttons: {
    yes: "Yes",
    no: "No",
    skip: "Skip",
  },
};
