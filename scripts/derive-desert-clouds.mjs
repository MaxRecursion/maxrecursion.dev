/**
 * Splits the hero sky of `public/images/desert-sky.webp` into two aligned layers:
 *
 * - `desert-sky-clear.webp`: the artwork with the sky's small-scale cloud detail
 *   softened. The blur samples sky rows only, so the mountains and dunes never
 *   bleed upward, and everything below the horizon is left as it is.
 * - `desert-clouds.webp`: the original colours with an alpha that keeps only that
 *   detail, fading out towards the horizon and at the left and right edges.
 *
 * The clouds drawn over the clear sky at offset 0 reproduce the artwork; the hero
 * slides copies of them with the wind. Run `node scripts/derive-desert-clouds.mjs`.
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
const CLEAR = path.join(images, "desert-sky-clear.webp");
const CLOUDS = path.join(images, "desert-clouds.webp");

/** The sky mask is 1 above SKY_TOP and 0 from SKY_BOTTOM; the mountains start at y ≈ 550. */
const SKY_TOP = 480;
const SKY_BOTTOM = 540;
/** Rows the blur may sample. */
const SKY_ROWS = 546;
/** Wide enough to dissolve the cloud streaks while keeping the glow behind them, image px. */
const BLUR_SIGMA = 24;
/** Window of the local RMS colour difference between the artwork and the clear sky, image px. */
const DETAIL_SIGMA = 5;
/** RMS differences (0–255) where a cloud starts to show and where it is fully kept. */
const DETAIL_FROM = 1.2;
const DETAIL_TO = 4;
/** Image px faded at the left and right edges, so a shifted copy has no seam. */
const EDGE_FADE = 140;

function smoothstep(from, to, value) {
  const t = Math.min(1, Math.max(0, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

/** Separable Gaussian over a width × rows plane, treating everything outside it as 0. */
function blur(plane, width, rows, sigma) {
  const radius = Math.ceil(3 * sigma);
  const kernel = Float32Array.from({ length: 2 * radius + 1 }, (_, i) => Math.exp(-((i - radius) ** 2) / (2 * sigma * sigma)));
  const across = new Float32Array(plane.length);
  for (let y = 0; y < rows; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let i = Math.max(-radius, -x), end = Math.min(radius, width - 1 - x); i <= end; i++) sum += kernel[i + radius] * plane[row + x + i];
      across[row + x] = sum;
    }
  }
  const result = new Float32Array(plane.length);
  for (let y = 0; y < rows; y++) {
    const row = y * width;
    for (let i = Math.max(-radius, -y), end = Math.min(radius, rows - 1 - y); i <= end; i++) {
      const weight = kernel[i + radius];
      const from = (y + i) * width;
      for (let x = 0; x < width; x++) result[row + x] += weight * across[from + x];
    }
  }
  return result;
}

/** Normalised convolution: a Gaussian mean of the sky rows that ignores everything outside them. */
function skyMean(plane, width, sigma) {
  const mean = blur(plane, width, SKY_ROWS, sigma);
  const coverage = blur(new Float32Array(plane.length).fill(1), width, SKY_ROWS, sigma);
  return mean.map((value, i) => value / coverage[i]);
}

const { data: original, info } = await sharp(SOURCE).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;
const skyPixels = width * SKY_ROWS;
const sky = Float32Array.from({ length: height }, (_, y) => 1 - smoothstep(SKY_TOP, SKY_BOTTOM, y));

const clear = Float32Array.from(original);
for (let c = 0; c < 3; c++) {
  const blurred = skyMean(Float32Array.from({ length: skyPixels }, (_, i) => original[i * 3 + c]), width, BLUR_SIGMA);
  for (let i = 0; i < skyPixels; i++) clear[i * 3 + c] += sky[Math.floor(i / width)] * (blurred[i] - original[i * 3 + c]);
}

// Colour, not luma: the faint wisps are warmer than the sky more than they are brighter.
const difference = Float32Array.from({ length: skyPixels }, (_, i) =>
  ((original[i * 3] - clear[i * 3]) ** 2 + (original[i * 3 + 1] - clear[i * 3 + 1]) ** 2 + (original[i * 3 + 2] - clear[i * 3 + 2]) ** 2) / 3);
const detail = skyMean(difference, width, DETAIL_SIGMA);

const clouds = Buffer.alloc(width * height * 4);
for (let i = 0; i < width * height; i++) {
  const x = i % width;
  const edges = smoothstep(0, EDGE_FADE, x) * smoothstep(0, EDGE_FADE, width - 1 - x);
  const alpha = i < skyPixels ? sky[(i - x) / width] * edges * smoothstep(DETAIL_FROM, DETAIL_TO, Math.sqrt(detail[i])) : 0;
  clouds.set(original.subarray(i * 3, i * 3 + 3), i * 4);
  clouds[i * 4 + 3] = Math.round(255 * alpha);
}

await sharp(Uint8ClampedArray.from(clear), { raw: { width, height, channels: 3 } })
  .webp({ quality: 90, effort: 6, smartSubsample: true })
  .toFile(CLEAR);
await sharp(clouds, { raw: { width, height, channels: 4 } })
  .webp({ quality: 88, alphaQuality: 100, effort: 6, smartSubsample: true })
  .toFile(CLOUDS);

// Check the encoded pair: clouds over the clear sky at offset 0 against the artwork.
const clearOut = await sharp(CLEAR).removeAlpha().raw().toBuffer();
const cloudsOut = await sharp(CLOUDS).ensureAlpha().raw().toBuffer();
let skyError = 0;
let groundError = 0;
for (let i = 0; i < width * height; i++) {
  const alpha = cloudsOut[i * 4 + 3] / 255;
  for (let c = 0; c < 3; c++) {
    const composite = clearOut[i * 3 + c] * (1 - alpha) + cloudsOut[i * 4 + c] * alpha;
    if (i < width * SKY_BOTTOM) skyError += Math.abs(composite - original[i * 3 + c]);
    else groundError += Math.abs(clearOut[i * 3 + c] - original[i * 3 + c]);
  }
}
const size = (file) => `${(fs.statSync(file).size / 1024).toFixed(1)} KB`;
console.log(`${path.basename(CLEAR)} ${size(CLEAR)}, ${path.basename(CLOUDS)} ${size(CLOUDS)}`);
console.log(`Mean absolute error (0–255): sky at offset 0 ${(skyError / (width * SKY_BOTTOM * 3)).toFixed(2)}, ground ${(groundError / (width * (height - SKY_BOTTOM) * 3)).toFixed(2)}`);
