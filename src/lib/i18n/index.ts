import { en, type BotDictionary } from "./dictionaries/en";
import { es } from "./dictionaries/es";
import { pt } from "./dictionaries/pt";
import { ar } from "./dictionaries/ar";
import { type Locale } from "./locale";

export type { BotDictionary } from "./dictionaries/en";
export * from "./locale";

const DICTS: Record<Locale, BotDictionary> = { en, es, pt, ar };

export function dict(locale: Locale): BotDictionary {
  return DICTS[locale] ?? en;
}
