import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_SITE_URL,
  buildMetadata,
  faqJsonLd,
  getSiteUrl,
  organizationJsonLd,
  softwareApplicationJsonLd,
  websiteJsonLd,
} from "./seo";

describe("getSiteUrl", () => {
  let original: string | undefined;
  beforeEach(() => {
    original = process.env.NEXT_PUBLIC_APP_URL;
  });
  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = original;
  });

  it("falls back to DEFAULT_SITE_URL when no env is set", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
    expect(getSiteUrl()).toBe(DEFAULT_SITE_URL);
  });

  it("respects NEXT_PUBLIC_APP_URL and strips trailing slash", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com/";
    expect(getSiteUrl()).toBe("https://example.com");
  });
});

describe("buildMetadata", () => {
  it("emits canonical + OG + twitter cards by default", () => {
    const meta = buildMetadata({ title: "Privacy", path: "/privacy" });
    expect(meta.alternates?.canonical).toBe("/privacy");
    expect(meta.openGraph?.title).toBe("Privacy · Will");
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
    expect(meta.robots).toMatchObject({ index: true, follow: true });
  });

  it("supports noindex pages", () => {
    const meta = buildMetadata({ title: "App", path: "/app", index: false });
    expect(meta.robots).toMatchObject({ index: false, follow: false });
  });

  it("emits hreflang alternates when pathByLocale is provided", () => {
    const meta = buildMetadata({
      title: "Home",
      path: "/",
      pathByLocale: { en: "/", es: "/es" },
    });
    const langs = meta.alternates?.languages;
    expect(langs).toBeDefined();
    expect(langs?.["en-US"]).toBe("/");
    expect(langs?.["es-ES"]).toBe("/es");
    expect(langs?.["x-default"]).toBe("/");
  });
});

describe("JSON-LD helpers", () => {
  it("organizationJsonLd is a valid Organization", () => {
    const data = organizationJsonLd();
    expect(data["@type"]).toBe("Organization");
    expect(data.name).toBe("Trefolio");
    expect(data.logo).toContain("/will-icon-512.png");
  });

  it("websiteJsonLd embeds a SearchAction", () => {
    const data = websiteJsonLd();
    expect(data["@type"]).toBe("WebSite");
    expect(data.potentialAction?.["@type"]).toBe("SearchAction");
  });

  it("softwareApplicationJsonLd is free and MIT", () => {
    const data = softwareApplicationJsonLd();
    expect(data.offers?.price).toBe("0");
    expect(data.license).toContain("MIT");
  });

  it("faqJsonLd projects entries to schema.org shape", () => {
    const data = faqJsonLd([{ question: "Q?", answer: "A." }]);
    expect(data["@type"]).toBe("FAQPage");
    expect(data.mainEntity[0]).toMatchObject({
      "@type": "Question",
      name: "Q?",
      acceptedAnswer: { "@type": "Answer", text: "A." },
    });
  });
});
