import type { MetadataRoute } from "next";

import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${SITE_NAME} — ${SITE_TAGLINE}`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/app?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#FFFFFF",
    theme_color: "#0F172A",
    lang: "en-US",
    dir: "ltr",
    categories: ["productivity", "lifestyle", "utilities"],
    prefer_related_applications: false,
    launch_handler: { client_mode: ["focus-existing", "auto"] },
    icons: [
      {
        src: "/will-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/will-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/will-icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Open Will",
        short_name: "Will",
        url: "/app",
        description: "Browse your daily journal.",
      },
      {
        name: "Connect Telegram",
        short_name: "Telegram",
        url: "/settings/telegram",
        description: "Link your Telegram account to send notes to Will.",
      },
      {
        name: "Reminders",
        short_name: "Reminders",
        url: "/app?tag=reminder",
        description: "See your active reminders.",
      },
    ],
  };
}
