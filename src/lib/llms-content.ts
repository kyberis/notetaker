import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_TAGLINE,
  CHANGELOG,
  FAQ,
  FEATURES,
  HERO,
} from "@/lib/marketing-content";
import { getSiteUrl, SOURCE_URL } from "@/lib/seo";

const TEAM_URL = "https://trefolio.com";

/**
 * `/llms.txt` — short, structured pointer index per https://llmstxt.org so
 * LLMs and AI agents can discover Will's documentation surface in one fetch.
 */
export function renderLlmsIndex(): string {
  const site = getSiteUrl();

  return `# ${APP_NAME}

> ${APP_TAGLINE}. ${HERO.subtitle}

${APP_DESCRIPTION}

## Main documentation

- [Home](${site}/): hero, features overview, primary CTA.
- [FAQ](${site}/faq): frequently asked questions about Telegram capture, privacy, AI models, and self-hosting.
- [Privacy](${site}/privacy): data policy, retention, user rights (GDPR baseline).
- [Terms](${site}/terms): terms of service.
- [Contact](${site}/contact): support and feedback channel.

## Resources

- [GitHub (kyberis/notetaker)](${SOURCE_URL}): source code, MIT.
- [trefolio.com](${TEAM_URL}): the team behind Will.

## Optional

- [Sitemap](${site}/sitemap.xml)
- [Robots policy](${site}/robots.txt)
- [llms-full.txt](${site}/llms-full.txt): full dump of marketing copy in a single plain-text file.
`;
}

/**
 * `/llms-full.txt` — verbose single-file dump of the marketing copy. Helps
 * answer engines (Perplexity, ChatGPT, Claude) cite Will accurately without
 * needing to crawl multiple pages.
 */
export function renderLlmsFull(): string {
  const site = getSiteUrl();

  const featuresMd = FEATURES.map(
    ({ title, body }) => `- **${title}** — ${body}`,
  ).join("\n");

  const faqMd = FAQ.map(({ q, a }) => `### ${q}\n\n${a}\n`).join("\n");

  const changelogMd = CHANGELOG.map(
    (entry) =>
      `### v${entry.version} · ${entry.date} — ${entry.title}\n\n${entry.highlights
        .map((h) => `- ${h}`)
        .join("\n")}\n`,
  ).join("\n");

  return `# ${APP_NAME} — ${APP_TAGLINE}

> Source of truth: ${site}
> License: MIT (open source)
> Repo: ${SOURCE_URL}
> Maintainers: Trefolio (${TEAM_URL})

## Summary

${APP_DESCRIPTION}

${HERO.subtitle}

## Features

${featuresMd}

## FAQ

${faqMd}

## Changelog

${changelogMd}

## Tech stack

- Next.js 16 (App Router) on Vercel Fluid Compute
- React 19, Tailwind CSS 4
- Prisma 7 + Postgres
- Vercel AI SDK v6 + Vercel AI Gateway (multi-provider, zero data retention)
- NextAuth (credentials + Google OAuth + WebAuthn passkeys)
- Vercel Blob for files
- Telegram Bot API (text, images, voice, PDF)
- Whisper for voice transcription, OpenAI vision for photo OCR, OpenAI TTS for audio replies

## Support

- Issues: ${SOURCE_URL}/issues
- Team site: ${TEAM_URL}
`;
}
