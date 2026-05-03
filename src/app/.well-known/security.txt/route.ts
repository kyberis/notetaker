export const dynamic = "force-static";

export function GET() {
  const expires = new Date();
  expires.setUTCFullYear(expires.getUTCFullYear() + 1);
  const lines = [
    "Contact: mailto:security@trefolio.com",
    `Expires: ${expires.toISOString()}`,
    "Preferred-Languages: en, es, pt",
    "Canonical: https://will.trefolio.com/.well-known/security.txt",
  ];
  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
