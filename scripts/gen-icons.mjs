import sharp from "sharp";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const svg = readFileSync("public/will-avatar.svg");

const out = "public";
mkdirSync(out, { recursive: true });

async function render(size, file, opts = {}) {
  // Cap density so we don't blow past sharp's pixel limit on large outputs.
  const density = Math.min(2400, Math.max(72, size * 4));
  const buf = await sharp(svg, { density, limitInputPixels: false })
    .resize(size, size, { fit: "contain", background: opts.bg ?? { r: 15, g: 23, b: 42, alpha: 1 } })
    .png()
    .toBuffer();
  writeFileSync(join(out, file), buf);
  console.log(file, buf.length);
}

await render(192, "will-icon-192.png");
await render(512, "will-icon-512.png");
// Maskable: ensure safe zone — render the SVG inside a 80% inner box on the navy background.
const maskableSize = 512;
const inner = Math.round(maskableSize * 0.78);
const innerBuf = await sharp(svg, { density: Math.max(72, inner * 4) })
  .resize(inner, inner, { fit: "contain", background: { r: 15, g: 23, b: 42, alpha: 1 } })
  .png()
  .toBuffer();
const maskBg = await sharp({
  create: {
    width: maskableSize,
    height: maskableSize,
    channels: 4,
    background: { r: 15, g: 23, b: 42, alpha: 1 },
  },
})
  .composite([
    { input: innerBuf, top: Math.round((maskableSize - inner) / 2), left: Math.round((maskableSize - inner) / 2) },
  ])
  .png()
  .toBuffer();
writeFileSync(join(out, "will-icon-maskable.png"), maskBg);
console.log("will-icon-maskable.png", maskBg.length);

await render(180, "apple-icon.png");
await render(1024, "will-icon.png");
