import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import {
  ELEVATOR_PITCH,
  FAQ,
  FEATURES,
  HERO_PITCH,
  LANDING_COPY,
} from "@/lib/marketing-content";
import {
  buildMetadata,
  faqJsonLd,
  jsonLdScript,
  softwareApplicationJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: LANDING_COPY.metaTitle,
  description: LANDING_COPY.metaDescription,
  path: "/",
});

const FEATURE_STICKER_VARIANTS = [
  "sticker-gilt",
  "sticker-ivy",
  "sticker-wax",
  "sticker-plum",
] as const;

/** Small fleuron used in each corner of the portrait frame. */
function CornerFleuron({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      className={`portrait-corner ${className}`}
      aria-hidden
    >
      <g fill="currentColor">
        <path d="M2 2 L2 8 L4 8 L4 4 L8 4 L8 2 Z" />
        <circle cx="9" cy="9" r="1.6" />
      </g>
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <script
        {...jsonLdScript([
          softwareApplicationJsonLd(),
          faqJsonLd(
            FAQ.slice(0, 6).map(({ q, a }) => ({ question: q, answer: a })),
          ),
        ])}
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto w-full max-w-6xl px-4 pt-14 pb-12 sm:px-6 sm:pt-20 sm:pb-16">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
            {/* Hero copy */}
            <div className="space-y-7">
              <span className="sticker sticker-gilt">{LANDING_COPY.chip}</span>
              <h1 className="display text-foreground text-5xl leading-[0.98] sm:text-6xl lg:text-7xl">
                {LANDING_COPY.titleLine1}
                <br />
                <span className="display-italic text-foreground/95">
                  {LANDING_COPY.titleLine2Pre}
                </span>
                <span className="hl">{LANDING_COPY.titleLine2Highlight}</span>
              </h1>
              <p className="text-foreground/85 max-w-xl text-lg leading-relaxed">
                {HERO_PITCH}
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  href="/register"
                  className="bg-foreground text-background hover:bg-foreground/90 inline-flex h-12 items-center gap-2 rounded-full px-6 text-base font-semibold shadow-sm transition-colors"
                >
                  {LANDING_COPY.ctaPrimary}
                  <span aria-hidden>→</span>
                </Link>
                <Link
                  href="/faq"
                  className="surface-card inline-flex h-12 items-center rounded-full px-6 text-base font-semibold transition-transform hover:scale-[1.01]"
                >
                  {LANDING_COPY.ctaSecondary}
                </Link>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="sticker sticker-soft">{LANDING_COPY.badgeFree}</span>
                <span className="sticker sticker-soft">
                  {LANDING_COPY.badgeOpenSource}
                </span>
                <span className="sticker sticker-soft">
                  {LANDING_COPY.badgeSelfHosted}
                </span>
              </div>
            </div>

            {/* Hero Telegram preview */}
            <div className="relative">
              <div className="absolute -top-5 -left-2 z-20 sm:-left-4">
                <div className="ink-card flex items-center gap-3 rounded-full px-4 py-2.5">
                  <div className="leading-none">
                    <p className="smallcaps text-[10px] text-[oklch(0.78_0.13_85)]">
                      {LANDING_COPY.previewFloatingLabel}
                    </p>
                    <p className="num mt-0.5 text-base text-white">
                      {LANDING_COPY.previewFloatingMeta}
                    </p>
                  </div>
                  <span className="sticker sticker-gilt">
                    {LANDING_COPY.previewFloatingSticker}
                  </span>
                </div>
              </div>

              <div className="surface-card relative space-y-4 p-6 pt-10 sm:p-7 sm:pt-12">
                <div className="flex items-center gap-3">
                  <Image
                    src="/will-avatar.svg"
                    alt="Will"
                    width={56}
                    height={56}
                    priority
                    className="avatar-will size-14 shrink-0 p-2"
                  />
                  <div>
                    <p className="display text-foreground text-base font-bold">
                      {LANDING_COPY.previewBotHandle}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {LANDING_COPY.previewBotStatus}
                    </p>
                  </div>
                  <span className="sticker sticker-ivy ml-auto">
                    {LANDING_COPY.previewBotChip}
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="flex justify-end">
                    <div className="bubble-user max-w-[85%] px-4 py-2.5 text-sm">
                      {LANDING_COPY.previewUser1}
                    </div>
                  </div>

                  <div className="flex items-end gap-2.5">
                    <Image
                      src="/will-avatar.svg"
                      alt=""
                      width={40}
                      height={40}
                      aria-hidden
                      className="avatar-will size-10 shrink-0 p-1.5"
                    />
                    <div className="bubble-will max-w-[85%] space-y-2.5 px-4 py-3">
                      <p className="text-sm leading-snug">
                        {LANDING_COPY.previewWillBody}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="sticker sticker-gilt">
                          {LANDING_COPY.previewWillTagOne}
                        </span>
                        <span className="sticker sticker-wax">
                          {LANDING_COPY.previewWillTagTwo}
                        </span>
                      </div>
                      <div className="surface-soft flex items-center justify-between rounded-2xl px-3 py-2 text-xs">
                        <span className="text-foreground/85 font-medium">
                          🔔 {LANDING_COPY.previewWillReminderLabel}
                        </span>
                        <span className="num text-foreground font-bold">
                          {LANDING_COPY.previewWillReminderValue}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <div className="bubble-user max-w-[85%] px-4 py-2.5 text-sm">
                      {LANDING_COPY.previewUser2}
                    </div>
                  </div>

                  <div className="flex items-end gap-2.5">
                    <Image
                      src="/will-avatar.svg"
                      alt=""
                      width={40}
                      height={40}
                      aria-hidden
                      className="avatar-will size-10 shrink-0 p-1.5 opacity-60"
                    />
                    <div className="bubble-will flex items-center gap-1.5 px-4 py-3">
                      <span className="size-1.5 animate-pulse rounded-full bg-[var(--gilt-deep)]" />
                      <span
                        className="size-1.5 animate-pulse rounded-full bg-[var(--gilt-deep)]"
                        style={{ animationDelay: "0.15s" }}
                      />
                      <span
                        className="size-1.5 animate-pulse rounded-full bg-[var(--gilt-deep)]"
                        style={{ animationDelay: "0.3s" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dramatis personae — Meet Will */}
      <section className="px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="mx-auto max-w-5xl">
          <div className="fleuron mx-auto mb-8 w-40" aria-hidden />
          <div className="surface-card grid items-center gap-10 p-6 sm:p-10 lg:grid-cols-[auto_1fr]">
            {/* Folio-style portrait of the Will icon */}
            <figure className="portrait-frame mx-auto w-[15rem] sm:w-[16rem]">
              <CornerFleuron className="portrait-corner-tl" />
              <CornerFleuron className="portrait-corner-tr" />
              <CornerFleuron className="portrait-corner-bl" />
              <CornerFleuron className="portrait-corner-br" />
              <div className="relative aspect-square overflow-hidden rounded-[0.75rem]">
                <Image
                  src="/will-icon-512.png"
                  alt="The Will icon — a quill and notebook on deep navy."
                  width={512}
                  height={512}
                  priority
                  className="block h-full w-full object-cover"
                />
              </div>
              <figcaption className="display-italic text-muted-foreground mt-4 text-center text-sm">
                {LANDING_COPY.personaCardCaption}
              </figcaption>
            </figure>

            {/* Persona copy */}
            <div className="space-y-5">
              <span className="sticker sticker-plum">
                {LANDING_COPY.personaSticker}
              </span>
              <h2 className="display text-foreground text-4xl leading-tight sm:text-5xl">
                {LANDING_COPY.personaName}
              </h2>
              <p className="display-italic text-foreground/85 text-xl">
                {LANDING_COPY.personaTitle}
              </p>
              <blockquote className="border-l-2 border-[var(--gilt-deep)] pl-4 text-foreground/80 text-base leading-relaxed">
                {LANDING_COPY.personaQuote}
              </blockquote>
              <p className="text-foreground/80 leading-relaxed">
                {LANDING_COPY.personaBody}
              </p>
              <div className="rule-gilt mt-2" />
              <dl className="grid grid-cols-2 gap-3 pt-2 text-sm sm:grid-cols-4">
                <div>
                  <dt className="smallcaps text-muted-foreground text-[10px]">
                    {LANDING_COPY.personaMetaEst}
                  </dt>
                  <dd className="num text-foreground mt-1">
                    {LANDING_COPY.personaMetaEstValue}
                  </dd>
                </div>
                <div>
                  <dt className="smallcaps text-muted-foreground text-[10px]">
                    {LANDING_COPY.personaMetaLicence}
                  </dt>
                  <dd className="display text-foreground mt-1 text-lg">
                    {LANDING_COPY.personaMetaLicenceValue}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="smallcaps text-muted-foreground text-[10px]">
                    {LANDING_COPY.personaMetaHome}
                  </dt>
                  <dd className="display-italic text-foreground mt-1 text-base">
                    {LANDING_COPY.personaMetaHomeValue}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Capability tiles — what Will keeps */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="mb-6 flex items-center justify-center">
          <h3 className="display-italic text-muted-foreground text-base tracking-wide">
            {LANDING_COPY.capabilityHeading}
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="surface-card p-5">
            <p className="smallcaps text-muted-foreground text-[10px]">
              {LANDING_COPY.capabilityVoiceLabel}
            </p>
            <p className="display mt-1 text-3xl">🎙️</p>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              {LANDING_COPY.capabilityVoiceBody}
            </p>
          </div>
          <div className="surface-card p-5">
            <p className="smallcaps text-muted-foreground text-[10px]">
              {LANDING_COPY.capabilityPhotoLabel}
            </p>
            <p className="display mt-1 text-3xl">📷</p>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              {LANDING_COPY.capabilityPhotoBody}
            </p>
          </div>
          <div className="surface-card p-5">
            <p className="smallcaps text-muted-foreground text-[10px]">
              {LANDING_COPY.capabilityPdfLabel}
            </p>
            <p className="display mt-1 text-3xl">📜</p>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              {LANDING_COPY.capabilityPdfBody}
            </p>
          </div>
          <div className="surface-card relative p-5">
            <p className="smallcaps text-muted-foreground text-[10px]">
              {LANDING_COPY.capabilityRemindLabel}
            </p>
            <p className="display mt-1 text-3xl">🕰️</p>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              {LANDING_COPY.capabilityRemindBody}
            </p>
          </div>
        </div>
      </section>

      {/* Editorial pitch with drop-cap */}
      <section className="px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="mx-auto max-w-3xl space-y-5 text-center">
          <div className="fleuron mx-auto w-40" aria-hidden />
          <span className="sticker sticker-wax">
            {LANDING_COPY.pitchSticker}
          </span>
          <h2 className="display text-foreground text-4xl leading-tight sm:text-5xl">
            {LANDING_COPY.pitchTitlePart1}
            <span className="hl hl-wax">{LANDING_COPY.pitchTitleHighlight}</span>
            {LANDING_COPY.pitchTitlePart2}
          </h2>
          <p className="dropcap text-foreground/85 mx-auto max-w-2xl text-left text-lg leading-relaxed">
            {ELEVATOR_PITCH} {LANDING_COPY.pitchExtra}
          </p>
        </div>
      </section>

      {/* Features grid */}
      <section
        id="features"
        className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6"
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ emoji, title, body }, idx) => {
            const variant =
              FEATURE_STICKER_VARIANTS[idx % FEATURE_STICKER_VARIANTS.length];
            return (
              <li key={title} className="surface-card flex flex-col gap-3 p-6">
                <span className={`sticker ${variant} self-start`}>
                  <span aria-hidden>{emoji}</span>
                  <span>{title}</span>
                </span>
                <p className="text-foreground/85 text-sm leading-relaxed">
                  {body}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Self-host callout */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="ink-card ink-glow grid items-center gap-8 p-8 text-white/90 sm:p-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            <span className="sticker sticker-gilt">
              {LANDING_COPY.selfHostSticker}
            </span>
            <h2 className="display text-3xl leading-tight text-white sm:text-4xl">
              {LANDING_COPY.selfHostTitlePart1}
              <span className="hl hl-ivy">
                {LANDING_COPY.selfHostTitleHighlight}
              </span>
              {LANDING_COPY.selfHostTitlePart2}
            </h2>
            <p className="max-w-xl leading-relaxed text-white/80">
              {LANDING_COPY.selfHostBody}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/faq"
                className="gradient-gilt text-foreground inline-flex h-11 items-center rounded-full px-5 text-sm font-bold transition-opacity hover:opacity-90"
              >
                {LANDING_COPY.selfHostHowTo}
              </Link>
              <a
                href="https://github.com/kyberis/notetaker"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center rounded-full border border-white/30 px-5 text-sm font-medium transition-colors hover:bg-white/10"
              >
                {LANDING_COPY.selfHostGitHub}
              </a>
            </div>
          </div>
          <pre className="overflow-x-auto rounded-2xl bg-black/40 p-5 font-mono text-xs leading-relaxed text-white/85 sm:text-sm">
            <code>{`${LANDING_COPY.selfHostSnippetComment}
git clone https://github.com/kyberis/notetaker
cd notetaker
cp .env.example .env
npm install
npx prisma migrate deploy
npm run dev`}</code>
          </pre>
        </div>
      </section>

      {/* Editorial quote */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="fleuron mx-auto mb-6 w-40" aria-hidden />
          <div className="surface-card relative overflow-hidden p-10 text-center sm:p-14">
            <span className="sticker sticker-wax mb-4 inline-block">
              {LANDING_COPY.ruleSticker}
            </span>
            <h2 className="display text-foreground text-3xl leading-tight sm:text-4xl">
              {LANDING_COPY.ruleTitlePart1}
              <span className="hl hl-plum">
                {LANDING_COPY.ruleTitleHighlight}
              </span>
              {LANDING_COPY.ruleTitlePart2}
            </h2>
            <p className="text-foreground/85 mx-auto mt-4 max-w-2xl leading-relaxed">
              {LANDING_COPY.ruleBody}
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto w-full max-w-3xl px-4 pb-24 text-center sm:px-6">
        <div className="fleuron mx-auto mb-6 w-40" aria-hidden />
        <h2 className="display text-foreground text-4xl leading-tight sm:text-5xl">
          {LANDING_COPY.finalTitlePart1}
          <span className="hl">{LANDING_COPY.finalTitleHighlight}</span>
          {LANDING_COPY.finalTitlePart2}
        </h2>
        <p className="text-foreground/85 mx-auto mt-4 max-w-xl text-lg">
          {LANDING_COPY.finalBody}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/register"
            className="bg-foreground text-background hover:bg-foreground/90 inline-flex h-12 items-center gap-2 rounded-full px-6 text-base font-semibold shadow-sm transition-colors"
          >
            {LANDING_COPY.finalRegister}
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/faq"
            className="surface-card inline-flex h-12 items-center rounded-full px-6 text-base font-semibold transition-transform hover:scale-[1.01]"
          >
            {LANDING_COPY.finalFaq}
          </Link>
        </div>
      </section>
    </>
  );
}
