/**
 * Regenerate Will's icon set from the canonical Shakespeare portrait.
 *
 * Source of truth:
 *   public/will-portrait-source.png  — the 1024x1024 cartoon portrait of
 *   "Will" (William Shakespeare illustration) used as the brand mark.
 *
 * Outputs (all in /public, used by manifest.ts, layout.tsx, opengraph-image,
 * apple-touch icon, and the PWA installer):
 *   will-icon-192.png         · PWA icon
 *   will-icon-512.png         · PWA icon + OG card hero
 *   will-icon-maskable.png    · Android adaptive icon (safe inner zone)
 *   will-icon.png             · 1024px hi-res master used by docs / blog
 *   apple-icon.png            · iOS home-screen (180px)
 *
 * Plus the Next.js favicon convention at src/app/icon.png (32px).
 *
 * Run with:  node scripts/gen-icons.mjs
 */
import sharp from "sharp";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SRC = "public/will-portrait-source.png";
const PUBLIC = "public";
const APP = "src/app";

const buf = readFileSync(SRC);
const meta = await sharp(buf).metadata();
console.log("source:", meta.width, "x", meta.height);

mkdirSync(PUBLIC, { recursive: true });
mkdirSync(APP, { recursive: true });

const NAVY = { r: 15, g: 23, b: 42, alpha: 1 };

async function emit(file, size, opts = {}) {
  const out = await sharp(buf, { limitInputPixels: false })
    .resize(size, size, { fit: "cover", background: opts.bg ?? NAVY })
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(file, out);
  console.log(file, out.length);
}

await emit(join(PUBLIC, "will-icon-192.png"), 192);
await emit(join(PUBLIC, "will-icon-512.png"), 512);
await emit(join(PUBLIC, "will-icon.png"), 1024);
await emit(join(PUBLIC, "apple-icon.png"), 180);

// Next.js convention: src/app/icon.png is auto-served as /favicon.
// 64px gives crisp 32px and 16px downscaled by Next on demand.
await emit(join(APP, "icon.png"), 64);

// Maskable: pad the portrait into the centre 78% of the frame so Android
// can crop a circle without chopping the ruff or the floating quill.
{
  const size = 512;
  const inner = Math.round(size * 0.78);
  const padded = await sharp(buf, { limitInputPixels: false })
    .resize(inner, inner, { fit: "cover", background: NAVY })
    .toBuffer();
  const out = await sharp({
    create: { width: size, height: size, channels: 4, background: NAVY },
  })
    .composite([
      {
        input: padded,
        top: Math.round((size - inner) / 2),
        left: Math.round((size - inner) / 2),
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(join(PUBLIC, "will-icon-maskable.png"), out);
  console.log(join(PUBLIC, "will-icon-maskable.png"), out.length);
}
