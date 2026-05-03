import type { Metadata } from "next";

import { type Locale, toBcp47 } from "@/lib/i18n/locale";
import { getPublicAppBaseUrl } from "@/lib/public-app-url";

/**
 * Default canonical origin used when no `NEXT_PUBLIC_APP_URL` / `VERCEL_URL`
 * is set (local builds, prerender during `next build`). Keep this aligned
 * with the production domain.
 */
export const DEFAULT_SITE_URL = "https://will.trefolio.com";

export function getSiteUrl(): string {
  return getPublicAppBaseUrl() ?? DEFAULT_SITE_URL;
}

export const SITE_NAME = "Will";

/**
 * The web UI is English-only by design (the Telegram bot is the multilingual
 * channel). The locale-aware helpers below still exist so future SEO work
 * can localise into other languages if we ever ship translated marketing
 * pages — the shape mirrors Clara's so patterns stay portable across the
 * two products.
 */
export const SITE_TAGLINE_EN = "Tell Will what you will.";
export const SITE_TAGLINE = SITE_TAGLINE_EN;

export const SITE_DESCRIPTION_EN =
  "Will is a Telegram-first, open-source AI note-taking assistant. Send a message, a voice note, a photo, or a PDF — Will saves it, suggests tags, and pings you back when a reminder is due.";
export const SITE_DESCRIPTION = SITE_DESCRIPTION_EN;

export function siteTagline(_locale: Locale): string {
  return SITE_TAGLINE_EN;
}

export function siteDescription(_locale: Locale): string {
  return SITE_DESCRIPTION_EN;
}

const KEYWORDS_EN = [
  "note-taking app",
  "Telegram notes",
  "AI note taker",
  "voice notes",
  "voice to text notes",
  "PDF notes",
  "photo notes",
  "AI tagging",
  "smart reminders",
  "open source notes",
  "self-hosted notes",
  "MIT note taker",
  "Telegram bot AI",
  "personal journal",
  "second brain",
  "Next.js notes",
  "GDPR notes",
  "private notes",
];

export function siteKeywords(_locale: Locale): string[] {
  return KEYWORDS_EN;
}

export const SITE_KEYWORDS: string[] = KEYWORDS_EN;

export const ORG_LEGAL_NAME = "Trefolio";
export const ORG_URL = "https://trefolio.com";
export const SUPPORT_URL = "https://github.com/kyberis/notetaker/issues";
export const SOURCE_URL = "https://github.com/kyberis/notetaker";

type BuildMetadataInput = {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  /** Override the OpenGraph type (defaults to "website"). */
  ogType?: "website" | "article";
  /** Set to false to mark the page noindex (used for the auth surface). */
  index?: boolean;
  /** Article metadata (changelog entries, etc.). */
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    section?: string;
    tags?: string[];
  };
  /**
   * Active locale for the page. Drives `og:locale` and the canonical link.
   * Web is English-only today, so this defaults to `"en"`.
   */
  locale?: Locale;
  /**
   * Locale-aware paths used to emit `alternates.languages` (hreflang). When
   * omitted, the canonical link uses `path` as-is and no hreflang is set.
   */
  pathByLocale?: Partial<Record<Locale, string>>;
};

/**
 * Build a `Metadata` object for a marketing/public page with consistent
 * OpenGraph + Twitter cards, canonical URL, robots policy and (optionally)
 * language alternates. Mirrors Clara's `buildMetadata` so callers stay
 * portable across the two products.
 */
export function buildMetadata({
  title,
  description,
  path = "/",
  image,
  ogType = "website",
  index = true,
  article,
  locale = "en",
  pathByLocale,
}: BuildMetadataInput): Metadata {
  const resolvedDescription = description ?? siteDescription(locale);
  const url = path.startsWith("http") ? path : path;
  const canonicalPath = pathByLocale?.[locale] ?? (path === "/" ? "/" : path);

  const ogImages = image
    ? [{ url: image, width: 1200, height: 630, alt: `${SITE_NAME} — ${title}` }]
    : undefined;

  const languages = pathByLocale
    ? Object.fromEntries(
        Object.entries(pathByLocale).map(([loc, p]) => [
          toBcp47(loc as Locale),
          p ?? canonicalPath,
        ]),
      )
    : undefined;

  return {
    title,
    description: resolvedDescription,
    alternates: {
      canonical: canonicalPath,
      ...(languages
        ? { languages: { ...languages, "x-default": canonicalPath } }
        : {}),
    },
    openGraph: {
      type: ogType,
      title: `${title} · ${SITE_NAME}`,
      description: resolvedDescription,
      siteName: SITE_NAME,
      locale: toBcp47(locale).replace("-", "_"),
      url,
      images: ogImages,
      ...(article ? { ...article } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${SITE_NAME}`,
      description: resolvedDescription,
      images: image ? [image] : undefined,
    },
    robots: index
      ? {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large" },
        }
      : { index: false, follow: false },
  };
}

/** Re-export so callers can write `<html lang={htmlLang(locale)} />`. */
export const htmlLang = toBcp47;

/**
 * JSON-LD `Organization` describing Trefolio (the team behind Will).
 */
export function organizationJsonLd() {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORG_LEGAL_NAME,
    url: ORG_URL,
    logo: `${site}/will-icon-512.png`,
    sameAs: [SOURCE_URL, ORG_URL],
  };
}

/**
 * JSON-LD `WebSite` with a `SearchAction` for FAQ text search.
 */
export function websiteJsonLd() {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: SITE_TAGLINE,
    url: site,
    inLanguage: ["en-US"],
    publisher: { "@type": "Organization", name: ORG_LEGAL_NAME, url: ORG_URL },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${site}/faq?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * JSON-LD `SoftwareApplication` describing Will.
 */
export function softwareApplicationJsonLd() {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    alternateName: "Will — Telegram-first AI note-taking assistant",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web, iOS (Telegram), Android (Telegram)",
    url: site,
    description: SITE_DESCRIPTION,
    inLanguage: ["en-US"],
    softwareVersion: "0.1.0",
    license: "https://opensource.org/licenses/MIT",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: { "@type": "Organization", name: ORG_LEGAL_NAME, url: ORG_URL },
    publisher: { "@type": "Organization", name: ORG_LEGAL_NAME, url: ORG_URL },
    featureList: [
      "Telegram-first capture: text, voice, photo, PDF",
      "AI tag suggestions on every new note",
      "Active reminders dispatched via 1-minute cron",
      "Multilingual agent: English, Spanish, Portuguese, Arabic",
      "Email + Google + passkey sign-in",
      "Full GDPR baseline: 30-day soft-delete, JSON export",
      "Open source MIT, self-hostable on Vercel + Postgres",
    ],
  };
}

export type FaqEntry = { question: string; answer: string };

export function faqJsonLd(entries: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

export type Crumb = { name: string; path: string };

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${site}${c.path}`,
    })),
  };
}

/**
 * Render JSON-LD payload(s) as a `<script type="application/ld+json">` props
 * object. Use as: `<script {...jsonLdScript(payload)} />` inside a Server
 * Component.
 */
export function jsonLdScript(data: unknown | unknown[]): {
  type: "application/ld+json";
  dangerouslySetInnerHTML: { __html: string };
} {
  return {
    type: "application/ld+json",
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
  };
}
