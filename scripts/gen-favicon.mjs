/**
 * Regenerate the site icons from `R logo.png`.
 * Run after changing the logo:  node scripts/gen-favicon.mjs
 *
 * Produces the white R mark on a brand-red rounded tile:
 *   src/app/icon.png        512  (browser tab / PWA)
 *   src/app/apple-icon.png  180  (iOS home screen)
 *   src/app/favicon.ico     16/32/48  (legacy /favicon.ico)
 */
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";
import { writeFile } from "node:fs/promises";

const root = fileURLToPath(new URL("..", import.meta.url));
const BRAND = "#e8262c";

async function tile(size) {
  const radius = Math.round(size * 0.22);
  const pad = Math.round(size * 0.2);
  const inner = size - pad * 2;

  const bg = Buffer.from(
    `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${BRAND}"/></svg>`,
  );
  const mark = await sharp(root + "R logo.png")
    .resize(inner, inner, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  return sharp(bg)
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toBuffer();
}

const icon512 = await tile(512);
await writeFile(root + "src/app/icon.png", icon512);
await writeFile(root + "src/app/apple-icon.png", await tile(180));

const ico = await pngToIco([
  await sharp(icon512).resize(16, 16).png().toBuffer(),
  await sharp(icon512).resize(32, 32).png().toBuffer(),
  await sharp(icon512).resize(48, 48).png().toBuffer(),
]);
await writeFile(root + "src/app/favicon.ico", ico);

console.log("Wrote src/app/icon.png, apple-icon.png, favicon.ico");
