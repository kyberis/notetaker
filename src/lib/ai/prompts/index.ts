import { type Locale } from "@/lib/i18n/locale";

import { SYSTEM_PROMPT_AR } from "./ar";
import { SYSTEM_PROMPT_EN } from "./en";
import { SYSTEM_PROMPT_ES } from "./es";
import { SYSTEM_PROMPT_PT } from "./pt";

export function buildSystemPrompt(opts: { locale: Locale; nowUtc: Date }): string {
  const template =
    opts.locale === "es"
      ? SYSTEM_PROMPT_ES
      : opts.locale === "pt"
      ? SYSTEM_PROMPT_PT
      : opts.locale === "ar"
      ? SYSTEM_PROMPT_AR
      : SYSTEM_PROMPT_EN;
  return template
    .replaceAll("{LOCALE}", opts.locale)
    .replaceAll("{NOW_UTC}", opts.nowUtc.toISOString());
}
