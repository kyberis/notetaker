import type { Locale } from "@/lib/i18n/locale";
import { toBcp47 } from "@/lib/i18n/locale";

/**
 * Bucket a list of notes into day-grouped sections in descending order
 * (today, yesterday, ...). The "day" key is rendered in the user's locale
 * so the web list reads naturally in any of our supported languages.
 *
 * Pure function. No DB access.
 */
export type Bucketable = { id: string; occurredAt: Date };

export type DayBucket<T extends Bucketable> = {
  /** ISO yyyy-mm-dd of the date in UTC. Stable React key. */
  key: string;
  /** Display label localised to the user's preferred locale. */
  label: string;
  notes: T[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

function toUtcDateKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfUtcDay(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function bucketByDay<T extends Bucketable>(notes: T[], locale: Locale = "en", now: Date = new Date()): DayBucket<T>[] {
  const groups = new Map<string, T[]>();
  for (const note of notes) {
    const key = toUtcDateKey(note.occurredAt);
    const existing = groups.get(key);
    if (existing) {
      existing.push(note);
    } else {
      groups.set(key, [note]);
    }
  }

  const todayUtc = startOfUtcDay(now);
  const formatter = new Intl.DateTimeFormat(toBcp47(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const buckets: DayBucket<T>[] = [];
  for (const [key, ns] of groups) {
    const date = new Date(key + "T00:00:00.000Z");
    const dayUtc = startOfUtcDay(date);
    const diffDays = Math.round((todayUtc - dayUtc) / DAY_MS);
    let label: string;
    if (diffDays === 0) label = labelFor("today", locale);
    else if (diffDays === 1) label = labelFor("yesterday", locale);
    else label = formatter.format(date);
    buckets.push({ key, label, notes: ns });
  }

  buckets.sort((a, b) => (a.key < b.key ? 1 : a.key > b.key ? -1 : 0));
  return buckets;
}

function labelFor(kind: "today" | "yesterday", locale: Locale): string {
  const labels: Record<Locale, { today: string; yesterday: string }> = {
    en: { today: "Today", yesterday: "Yesterday" },
    es: { today: "Hoy", yesterday: "Ayer" },
    pt: { today: "Hoje", yesterday: "Ontem" },
    ar: { today: "اليوم", yesterday: "أمس" },
  };
  return labels[locale][kind];
}
