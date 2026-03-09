/**
 * Generates PWA icons for PocketBudget in all required sizes.
 * Uses the sharp library to create PNG icons from an SVG source.
 * Run: node scripts/generate-icons.mjs
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outDir = path.join(process.cwd(), 'public', 'icons');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// SVG icon — wallet on indigo background with rounded corners
function makeSvg(size) {
  const pad = Math.round(size * 0.18);
  const iconSize = size - pad * 2;
  const r = Math.round(size * 0.22); // border-radius for maskable safe zone

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="url(#bg)"/>
  <!-- Wallet icon centered -->
  <g transform="translate(${pad}, ${pad})">
    <!-- Wallet body -->
    <rect x="${iconSize * 0.08}" y="${iconSize * 0.22}" width="${iconSize * 0.84}" height="${iconSize * 0.58}" rx="${iconSize * 0.1}" fill="white"/>
    <!-- Wallet flap -->
    <rect x="${iconSize * 0.08}" y="${iconSize * 0.18}" width="${iconSize * 0.68}" height="${iconSize * 0.22}" rx="${iconSize * 0.08}" fill="rgba(255,255,255,0.7)"/>
    <!-- Coin slot -->
    <rect x="${iconSize * 0.62}" y="${iconSize * 0.42}" width="${iconSize * 0.24}" height="${iconSize * 0.2}" rx="${iconSize * 0.06}" fill="#4f46e5"/>
    <!-- Coin dot -->
    <circle cx="${iconSize * 0.76}" cy="${iconSize * 0.52}" r="${iconSize * 0.05}" fill="white"/>
  </g>
</svg>`.trim();
}

async function generate() {
  for (const size of sizes) {
    const svg = makeSvg(size);
    const buf = Buffer.from(svg);
    const outPath = path.join(outDir, `icon-${size}x${size}.png`);
    await sharp(buf).png().toFile(outPath);
    console.log(`Generated ${outPath}`);
  }
  console.log('All PWA icons generated.');
}

generate().catch(console.error);
