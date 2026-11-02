/**
 * Spice grains riding the dune contours (`SPICE_LANES` in dune-geometry): the
 * part of each lane on the canvas, how many grains ride it, how far below the
 * line, their saltation hops, crest lift-off and the gust spring. Distances
 * along a lane are image pixels; hops and gust offsets are CSS pixels.
 *
 * This module has no runtime imports, so the Node test runner can load it.
 */
import type { Cover, DunePath } from "./dune-geometry";

/** A fine-grained flow: 3,300 grains of 1-2 px on wide screens, 1,440 on phones. */
export const GRAIN_COUNT = { wide: 3300, compact: 1440 } as const;
/** Highest saltation hop, CSS px. */
export const HOP_HEIGHT = 0.8;
/** Average share of grains blown off a crest they cross. */
export const LIFT_SHARE = 0.12;
/** Each grain leaves a crest somewhere from this far before it to this far after, image px. */
export const LIFT_WINDOW = [-8, 12] as const;
/** Farthest a gust can push a grain off the sand, CSS px per axis: a backstop beyond what a hover reaches. */
export const OFFSET_LIMIT = 48;

/** CSS px past the canvas edges that lanes still carry grains, and the fade at either end of a span. */
const EDGE_MARGIN = 24;
const EDGE_FADE = 44;
/** Shortest fade-out after a crest near the end of a span, CSS px. */
const CREST_FADE = 10;
/** Share of hop cycles in which a grain only slides. */
const HOP_SKIP = 0.35;
/** A hop rises quickly and glides back down to the sand. */
const HOP_PEAK = 0.38;
/** How fast a lifted grain levels off, 1/s. */
const LIFT_CLIMB = 1.8;
/** Gust spring: natural frequency (rad/s) and damping ratio, a touch under critical. */
const SPRING = 2.6;
const DAMPING = 0.9;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smooth01 = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

/** A 32-bit integer hash of two integers (lowbias32 finalizer). */
function hash(a: number, b: number) {
  let h = Math.imul(a, 0x9e3779b1) ^ b;
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Splits `total` grains over lanes in proportion to weight × on-screen length
 * by largest remainder, so the counts always add up to `total` exactly. Lanes
 * with no length on screen get none; with no lane on screen every count is 0.
 */
export function allocateGrains(lanes: readonly { weight: number; length: number }[], total: number): number[] {
  const shares = lanes.map(({ weight, length }) => (weight > 0 && length > 0 && Number.isFinite(weight * length) ? weight * length : 0));
  const sum = shares.reduce((a, b) => a + b, 0);
  const count = Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0;
  if (!(sum > 0) || !Number.isFinite(sum)) return shares.map(() => 0);

  const quotas = shares.map((share) => (share / sum) * count);
  const counts = quotas.map((quota) => Math.floor(quota));
  let left = count - counts.reduce((a, b) => a + b, 0);
  const order = quotas.map((_, i) => i).sort((a, b) => quotas[b] - counts[b] - (quotas[a] - counts[a]) || a - b);
  for (const i of order) {
    if (left <= 0) break;
    if (shares[i] > 0) {
      counts[i]++;
      left--;
    }
  }
  return counts;
}

/** A stretch of a lane between two arc lengths, image px. */
export type Span = { from: number; to: number };

/**
 * The stretch of a lane whose screen position lies within `margin` CSS px of a
 * width × height box, or null when none of it does.
 */
export function visibleSpan(path: DunePath, cover: Cover, width: number, height: number, margin = 0): Span | null {
  let first = -1;
  let last = -1;
  for (let i = 0; i < path.xs.length; i++) {
    const x = cover.x + path.xs[i] * cover.scale;
    const y = cover.y + path.ys[i] * cover.scale;
    if (x < -margin || x > width + margin || y < -margin || y > height + margin) continue;
    if (first < 0) first = i;
    last = i;
  }
  return first >= 0 && last > first ? { from: first * path.step, to: last * path.step } : null;
}

/** A spice lane as a path. */
export type SpiceTrack = {
  path: DunePath;
  spread: number;
  weight: number;
  /** Arc lengths of the crests where the wind lifts grains off. */
  crests: readonly number[];
};

/** The part of a lane on the canvas, the fades at its ends and the crests grains leave it from. */
export type LaneSpan = Span & { rampIn: number; rampOut: number; crests: readonly number[] };

/** Where a canvas sits inside the box the artwork covers, CSS px. */
export type CanvasBox = { x: number; y: number; width: number; height: number };

/** The lanes as laid out on one canvas. */
export type LaneLayout = {
  /** The artwork's placement on the canvas. */
  cover: Cover;
  /** One per lane; null for a lane off the canvas. */
  spans: (LaneSpan | null)[];
  counts: number[];
};

/**
 * Lays the lanes out on a canvas at `box` inside the box the artwork covers
 * with `artwork`: the artwork's placement on the canvas, each lane's span on
 * it and that lane's share of `total` grains. A span's fade-out starts after
 * the lift-off window of its last crest, which moves back a little when it is
 * at the very end, so no plume starts out faded.
 */
export function layoutLanes(tracks: readonly SpiceTrack[], artwork: Cover, box: CanvasBox, total: number): LaneLayout {
  const cover: Cover = { scale: artwork.scale, x: artwork.x - box.x, y: artwork.y - box.y };
  const spans = tracks.map((track): LaneSpan | null => {
    const span = visibleSpan(track.path, cover, box.width, box.height, EDGE_MARGIN);
    if (!span) return null;
    const ramp = Math.min(EDGE_FADE / cover.scale, (span.to - span.from) / 4);
    // The last crest leaves room for its lift-off window and the shortest fade.
    const latest = span.to - Math.min(ramp, CREST_FADE / cover.scale) - LIFT_WINDOW[1];
    const crests = latest > span.from
      ? track.crests.filter((crest) => crest > span.from && crest < span.to).map((crest) => Math.min(crest, latest))
      : [];
    const rampOut = crests.reduce((out, crest) => Math.min(out, span.to - crest - LIFT_WINDOW[1]), ramp);
    return { ...span, rampIn: ramp, rampOut, crests };
  });
  const counts = allocateGrains(spans.map((span, i) => ({ weight: tracks[i].weight, length: span ? span.to - span.from : 0 })), total);
  return { cover, spans, counts };
}

/**
 * Fades a grain in over the first `rampIn` of its span and out over the last
 * `rampOut`; ramps longer than the span shrink so it still peaks at 1.
 */
export function spanFade(s: number, from: number, to: number, rampIn: number, rampOut = rampIn): number {
  if (!(to > from) || s < from || s > to) return 0;
  const fadeIn = Math.min(to - from, Math.max(0, rampIn) || 0);
  const fadeOut = Math.min(to - from, Math.max(0, rampOut) || 0);
  const fit = Math.min(1, (to - from) / (fadeIn + fadeOut));
  return (fadeIn > 0 ? smooth01((s - from) / (fadeIn * fit)) : 1) * (fadeOut > 0 ? smooth01((to - s) / (fadeOut * fit)) : 1);
}

/**
 * Where a grain that ran past the end of its span re-enters: the overshoot is
 * kept so the stream stays even, `jitter` behind the start staggers re-entry.
 */
export function wrapToStart(s: number, from: number, to: number, jitter: number): number {
  if (s <= to) return s;
  const span = to - from;
  return span > 0 ? from - Math.max(0, jitter) + ((s - to) % span) : from;
}

/**
 * How far below the contour a grain rides, image px: `r²` keeps most grains
 * near the line, and a slow meander lets each wander a little across the face.
 */
export function surfaceOffset(spread: number, r: number, s: number, phase: number): number {
  const depth = Math.max(0, spread) * clamp01(r) ** 2;
  return depth * (0.8 + 0.2 * Math.sin(s / 90 + phase));
}

/** The wind quickens up a windward slope and slackens in the lee; `ty` is the slope, down positive. */
export function windFactor(ty: number): number {
  return Number.isFinite(ty) ? Math.max(0.8, Math.min(1.25, 1 - 0.9 * ty)) : 1;
}

/**
 * Height in CSS px of a grain skipping over the sand at arc length `s`. Each
 * `hop` px cycle is a short, low arc of irregular height and length, or a slide.
 */
export function saltation(s: number, hop: number, seed: number): number {
  if (!(hop > 0) || !Number.isFinite(s)) return 0;
  const cycle = s / hop;
  const k = Math.floor(cycle);
  const h = hash(k, seed);
  const roll = (h & 0xffff) / 0x10000;
  if (roll < HOP_SKIP) return 0;
  // Aloft for 30–60% of the cycle, sliding for the rest.
  const v = (cycle - k) / (0.3 + 0.3 * ((h >>> 16) / 0x10000));
  if (v >= 1) return 0;
  const w = v < HOP_PEAK ? 1 - v / HOP_PEAK : (v - HOP_PEAK) / (1 - HOP_PEAK);
  return HOP_HEIGHT * (0.3 + (0.7 * (roll - HOP_SKIP)) / (1 - HOP_SKIP)) * (1 - w * w);
}

/** Chance that a grain crossing a crest is blown off: `LIFT_SHARE` on average, mostly grains on the line. */
export function liftoffChance(r: number): number {
  return LIFT_SHARE * 1.5 * (1 - clamp01(r) ** 2);
}

/** Opacity of a grain `age` seconds after it left the crest: 1 at lift-off, gone at `life`. */
export function liftoffFade(age: number, life: number): number {
  return life > 0 ? 1 - smooth01(age / life) : 0;
}

export type Flight = {
  /** Downwind and upward travel since lift-off, image px. */
  forward: number;
  up: number;
  /** Their rates, image px/s. */
  vForward: number;
  vUp: number;
};

/**
 * A grain blown off a crest leaves at `speed` (image px/s) and gathers pace
 * downwind while it climbs towards `rise` (image px) and levels off.
 */
export function liftoffFlight(age: number, speed: number, rise: number, out: Flight): Flight {
  const t = Math.max(0, age);
  const climb = Math.exp(-LIFT_CLIMB * t);
  out.forward = speed * t * (1 + 0.3 * t);
  out.vForward = speed * (1 + 0.6 * t);
  out.up = rise * (1 - climb);
  out.vUp = rise * LIFT_CLIMB * climb;
  return out;
}

/**
 * Advances one axis of grain `i`'s gust displacement by `dt` seconds: `force`
 * (px/s²) pushes it off the sand and a spring just under critical damping
 * brings it back. Clamped to `OFFSET_LIMIT`; settles to exactly zero.
 */
export function springStep(offset: Float32Array, velocity: Float32Array, i: number, force: number, dt: number) {
  let v = velocity[i] + (force - SPRING * SPRING * offset[i] - 2 * DAMPING * SPRING * velocity[i]) * dt;
  let o = offset[i] + v * dt;
  if (o > OFFSET_LIMIT) {
    o = OFFSET_LIMIT;
    v = Math.min(0, v);
  } else if (o < -OFFSET_LIMIT) {
    o = -OFFSET_LIMIT;
    v = Math.max(0, v);
  }
  if (!force && Math.abs(o) < 0.01 && Math.abs(v) < 0.05) {
    o = 0;
    v = 0;
  }
  offset[i] = o;
  velocity[i] = v;
}
