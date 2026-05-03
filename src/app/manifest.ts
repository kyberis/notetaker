import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Will",
    short_name: "Will",
    description: "Telegram-first note-taking AI assistant",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    icons: [
      { src: "/will-avatar.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
