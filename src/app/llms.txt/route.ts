import { APP_DESCRIPTION, APP_NAME, FAQ, FEATURES } from "@/lib/marketing-content";

export const dynamic = "force-static";

export function GET() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://will.trefolio.com";
  const lines = [
    `# ${APP_NAME}`,
    "",
    APP_DESCRIPTION,
    "",
    "## Features",
    ...FEATURES.map((f) => `- ${f.title}: ${f.body}`),
    "",
    "## FAQ",
    ...FAQ.flatMap((q) => [`### ${q.q}`, q.a, ""]),
    "",
    "## Links",
    `- Web: ${base}`,
    `- Privacy: ${base}/privacy`,
    `- Terms: ${base}/terms`,
    `- Source: https://github.com/kyberis/notetaker`,
  ];
  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
