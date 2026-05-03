import type { Metadata, Viewport } from "next";

import "./globals.css";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TAGLINE,
  getSiteUrl,
  jsonLdScript,
  organizationJsonLd,
  softwareApplicationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

const SITE_URL = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  keywords: SITE_KEYWORDS,
  authors: [{ name: "Trefolio", url: "https://trefolio.com" }],
  creator: "Trefolio",
  publisher: "Trefolio",
  category: "productivity",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/",
      "x-default": "/",
    },
    types: {
      "text/plain": "/llms.txt",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: {
      // Bing Webmaster Tools (also covers DuckDuckGo / Yahoo / Ecosia indirectly).
      ...(process.env.BING_SITE_VERIFICATION
        ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
        : {}),
    },
  },
  other: {
    // Discovery hint for AI clients that look for these in <head>.
    "ai-content-declaration": "human-authored",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  // Avoid the iOS auto-zoom on input focus while keeping pinch-zoom available.
  maximumScale: 5,
  // Tell Android Chrome to shrink the layout viewport when the on-screen
  // keyboard appears, so any sticky composer sits right above the keyboard
  // instead of being covered by it. iOS Safari already does this by default.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <head>
        <link
          rel="alternate"
          type="text/plain"
          href="/llms.txt"
          title="llms.txt"
        />
        <link
          rel="alternate"
          type="text/plain"
          href="/llms-full.txt"
          title="llms-full.txt"
        />
        <script
          {...jsonLdScript([
            organizationJsonLd(),
            websiteJsonLd(),
            softwareApplicationJsonLd(),
          ])}
        />
      </head>
      <body className="flex min-h-full flex-col overflow-x-clip">{children}</body>
    </html>
  );
}
