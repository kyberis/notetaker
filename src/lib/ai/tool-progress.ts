/**
 * Friendly, locale-aware progress labels for each agent tool. Used by the
 * Telegram webhook to edit a single status message in place as the agent
 * runs, so the user perceives forward motion ("Saving your note…",
 * "Suggesting tags…") instead of a generic typing dot.
 *
 * Keep these short (≤ ~40 chars). Telegram renders them on a single line.
 */

import type { Locale } from "@/lib/i18n/locale";

type LocaleMap = Record<Locale, string>;

/** Shown immediately on receipt, before any tool has been called. */
export const STATUS_THINKING: LocaleMap = {
  en: "💭 Thinking…",
  es: "💭 Pensando…",
  pt: "💭 Pensando…",
  ar: "💭 جاري التفكير…",
};

/** Fallback for tools we haven't curated yet. */
const STATUS_WORKING: LocaleMap = {
  en: "⚙️ Working on it…",
  es: "⚙️ Trabajando en eso…",
  pt: "⚙️ Trabalhando nisso…",
  ar: "⚙️ جاري العمل…",
};

const TOOL_LABELS: Record<string, LocaleMap> = {
  saveNote: {
    en: "📝 Saving your note…",
    es: "📝 Guardando tu nota…",
    pt: "📝 Salvando sua nota…",
    ar: "📝 جاري حفظ ملاحظتك…",
  },
  proposeTags: {
    en: "🏷️ Tagging…",
    es: "🏷️ Etiquetando…",
    pt: "🏷️ Marcando…",
    ar: "🏷️ جاري إضافة الوسوم…",
  },
  setReminder: {
    en: "⏰ Scheduling a reminder…",
    es: "⏰ Programando un recordatorio…",
    pt: "⏰ Agendando um lembrete…",
    ar: "⏰ جاري ضبط التذكير…",
  },
  listRecentNotes: {
    en: "📚 Looking up recent notes…",
    es: "📚 Buscando tus notas recientes…",
    pt: "📚 Consultando notas recentes…",
    ar: "📚 جاري البحث في ملاحظاتك الأخيرة…",
  },
  searchNotes: {
    en: "🔍 Searching your notes…",
    es: "🔍 Buscando en tus notas…",
    pt: "🔍 Pesquisando em suas notas…",
    ar: "🔍 جاري البحث في ملاحظاتك…",
  },
  // The tool only raises a confirmation card; the delete happens on the tap.
  deleteNote: {
    en: "🗑️ Preparing a confirmation…",
    es: "🗑️ Preparando la confirmación…",
    pt: "🗑️ Preparando a confirmação…",
    ar: "🗑️ جاري تجهيز التأكيد…",
  },
  updateNote: {
    en: "✏️ Updating the note…",
    es: "✏️ Actualizando la nota…",
    pt: "✏️ Atualizando a nota…",
    ar: "✏️ جاري تحديث الملاحظة…",
  },
  setUserLocale: {
    en: "🌐 Switching language…",
    es: "🌐 Cambiando el idioma…",
    pt: "🌐 Mudando o idioma…",
    ar: "🌐 جاري تغيير اللغة…",
  },
};

/**
 * Resolve a friendly status line for a given tool name. Falls back to a
 * generic "Working on it…" when the tool isn't in the curated list, so new
 * tools never block shipping.
 */
export function toolProgressLabel(toolName: string, locale: Locale): string {
  const map = TOOL_LABELS[toolName];
  if (map) return map[locale] ?? map.en;
  return STATUS_WORKING[locale] ?? STATUS_WORKING.en;
}

/** Initial "Thinking…" line shown before the first tool call. */
export function initialThinkingLabel(locale: Locale): string {
  return STATUS_THINKING[locale] ?? STATUS_THINKING.en;
}
