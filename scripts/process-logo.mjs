// One-off logo processing script: makes near-white pixels transparent,
// then exports sized variants for the UI (favicon, header, hero, og).
import sharp from "sharp";
import fs from "node:fs";

const SRC = "public/singhal-logo.png";
const OUT_DIR = "public/logo";

fs.mkdirSync(OUT_DIR, { recursive: true });

// Read raw RGBA, zero-out near-white alpha, re-encode.
const raw = await sharp(SRC).ensureAlpha().raw().toBuffer();
const meta = await sharp(SRC).metadata();
for (let i = 0; i < raw.length; i += 4) {
  const r = raw[i], g = raw[i + 1], b = raw[i + 2];
  // treat near-pure-white as transparent (chroma key)
  if (r > 238 && g > 238 && b > 238) {
    raw[i + 3] = 0; // alpha = 0
  } else if (r > 220 && g > 220 && b > 220) {
    // feather the edge so it doesn't look jagged
    raw[i + 3] = Math.round(raw[i + 3] * 0.4);
  }
}

const w = meta.width || 1024;
const h = meta.height || 1024;
const transparentPng = await sharp(raw, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();

// Export variants
const sizes = [
  { name: "favicon-32", size: 32 },
  { name: "icon-64", size: 64 },
  { name: "header-80", size: 80 },
  { name: "hero-220", size: 220 },
  { name: "og-512", size: 512 },
];

for (const { name, size } of sizes) {
  await sharp(transparentPng).resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(`${OUT_DIR}/${name}.png`);
}

// Also keep a full-size transparent master
await sharp(transparentPng).png().toFile(`${OUT_DIR}/master.png`);

// Build a favicon (browsers accept png favicons)
fs.copyFileSync(`${OUT_DIR}/favicon-32.png`, "public/favicon.png");

console.log("Logo variants created:", fs.readdirSync(OUT_DIR));
