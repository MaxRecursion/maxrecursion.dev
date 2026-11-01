/**
 * Traces the skyline of `public/images/desert-sky.webp` (the top edge of the
 * far mountains, the highest land in the artwork) and writes
 * `desert-sky-mask.svg`: the sky above it, in the artwork's 1672 × 941 pixel
 * space. The hero masks the sun with it, placed like the artwork, so the sun
 * sets behind the land instead of sliding over the dunes.
 * Run `node scripts/derive-desert-skyline.mjs`.
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Sharp ships with Next.js; resolve it from there instead of adding a dependency.
const require = createRequire(import.meta.url);
const sharp = require(require.resolve("sharp", { paths: [path.dirname(require.resolve("next/package.json"))] }));

const images = path.join(path.dirname(fileURLToPath(import.meta.url)), "../public/images");
const SOURCE = path.join(images, "desert-sky.webp");
const MASK = path.join(images, "desert-sky-mask.svg");

/** Rows searched for the skyline, image px; the mountains sit at y ≈ 550–580. */
const SEARCH_FROM = 530;
const SEARCH_TO = 610;
/** Land starts where a row falls this far below the brightest sky just above it. */
const DROP_RATIO = 0.9;
const DROP_MIN = 2.2;
/** Columns at the far left are too dark to read; they follow the first reliable column. */
const RELIABLE_FROM = 60;
/** Smoothing: a running median, then a short running mean, in columns. */
const MEDIAN = 10;
const MEAN = 3;
/** Columns between path points, and a soft edge so the sun meets the haze rather than a cut. */
const STEP = 4;
const FEATHER = 0.8;

const { data, info } = await sharp(SOURCE).greyscale().blur(1).raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;
const lum = (x, y) => data[y * width + x];

const edge = Array.from({ length: width }, (_, x) => {
  for (let y = SEARCH_FROM; y < SEARCH_TO; y++) {
    let above = 0;
    for (let k = 2; k < 8; k++) above = Math.max(above, lum(x, y - k));
    const here = (lum(x, y) + lum(x, y + 1) + lum(x, y + 2)) / 3;
    if (above > 8 && here < above * DROP_RATIO && above - here > DROP_MIN) return y;
  }
  return null;
});

// Bridge unreadable columns, then smooth.
const known = edge.flatMap((y, x) => (y === null || x < RELIABLE_FROM ? [] : [x]));
const filled = edge.map((y, x) => {
  if (y !== null && x >= RELIABLE_FROM) return y;
  const left = known.findLast((i) => i < x);
  const right = known.find((i) => i > x);
  if (left === undefined) return edge[right];
  if (right === undefined) return edge[left];
  return edge[left] + ((edge[right] - edge[left]) * (x - left)) / (right - left);
});
const median = filled.map((_, x) => {
  const window = filled.slice(Math.max(0, x - MEDIAN), x + MEDIAN + 1).sort((a, b) => a - b);
  return window[Math.floor(window.length / 2)];
});
const skyline = median.map((_, x) => {
  const window = median.slice(Math.max(0, x - MEAN), x + MEAN + 1);
  return window.reduce((a, b) => a + b, 0) / window.length;
});

// Past both edges, so the feather never fades the borders of the sky.
const points = [`-10 ${skyline[0].toFixed(1)}`];
for (let x = 0; x < width; x += STEP) points.push(`${x} ${skyline[x].toFixed(1)}`);
points.push(`${width + 10} ${skyline[width - 1].toFixed(1)}`);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
  + `<filter id="haze"><feGaussianBlur stdDeviation="${FEATHER}"/></filter>`
  + `<path filter="url(#haze)" d="M-10 -10L${width + 10} -10L${points.reverse().join("L")}Z"/></svg>\n`;
fs.writeFileSync(MASK, svg);

const rows = skyline.map((y) => Math.round(y));
console.log(`${path.basename(MASK)} ${(fs.statSync(MASK).size / 1024).toFixed(1)} KB, skyline y ${Math.min(...rows)}–${Math.max(...rows)}`);
