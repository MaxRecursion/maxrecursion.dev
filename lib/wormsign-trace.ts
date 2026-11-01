/**
 * The wormsign seismograph in the hero's left margin. Paper runs down from a
 * drum at `PAPER_SPEED` with the pen at the top edge. Each slot of paper keeps
 * the strongest reading the pen made over it and when it was made, so every
 * thumper beat survives at any frame rate, and a strip filled in one go after
 * a pause looks like one recorded live.
 *
 * This module has no runtime imports, so the Node test runner can load it.
 */
import type { Summons } from "./sandworms";

/** CSS px of paper per second. */
export const PAPER_SPEED = 12;
/** Seconds of signal per stored sample (3 px of paper), read this many times by the pen. */
export const SLOT_SECONDS = 0.25;
export const READS_PER_SLOT = 30;
const READ_SECONDS = SLOT_SECONDS / READS_PER_SLOT;
/** Pen response: faint tremor stays near the baseline, thumps and rear-ups swing wide. */
const PEN_GAMMA = 2.5;

const mod = (value: number, size: number) => ((value % size) + size) % size;

export type TraceStrip = {
  /** A ring of slots: the strongest signed reading in each and the clock time it was read. */
  readonly values: Float32Array;
  readonly times: Float64Array;
  /** Index of the latest read; read `r` is taken at clock time `r * SLOT_SECONDS / READS_PER_SLOT`. */
  last: number;
};

const slotsFor = (height: number) => (height > 0 ? Math.ceil(height / (PAPER_SPEED * SLOT_SECONDS)) : 0) + 2;

/** A strip with enough slots to cover `height` CSS px of paper. */
export function createStrip(height: number): TraceStrip {
  const capacity = slotsFor(height);
  return { values: new Float32Array(capacity), times: new Float64Array(capacity), last: -Infinity };
}

/** Takes reads `from` to `to` (indices, see `TraceStrip.last`), each slot keeping its strongest. */
function readInto(strip: TraceStrip, from: number, to: number, read: (t: number) => number) {
  const capacity = strip.values.length;
  for (let r = from; r <= to; r++) {
    const t = r * READ_SECONDS;
    const value = read(t);
    const i = mod(Math.floor(r / READS_PER_SLOT), capacity);
    // The first read of a slot replaces whatever the ring held a lap earlier.
    if (mod(r, READS_PER_SLOT) === 0 || Math.abs(value) > Math.abs(strip.values[i])) {
      strip.values[i] = value;
      strip.times[i] = t;
    }
  }
}

/**
 * Reads the signal up to clock time `now` (seconds). A new strip, or one left
 * behind for longer than it holds, is filled from the start of its paper:
 * the worms are a pure function of time, so the past can be read back.
 */
export function recordStrip(strip: TraceStrip, now: number, read: (t: number) => number): void {
  const last = Math.floor(now / READ_SECONDS);
  const oldest = Math.floor(last / READS_PER_SLOT) - strip.values.length + 1;
  readInto(strip, Math.max(strip.last + 1, oldest * READS_PER_SLOT), last, read);
  if (last > strip.last) strip.last = last;
}

/**
 * A strip covering `height` CSS px: `strip` itself when it already does, or a
 * longer one that keeps every slot `strip` holds and reads the older paper
 * below them from the clock. Only the latest summons can be read back, so an
 * earlier thumper survives only on paper the pen has already written.
 */
export function growStrip(strip: TraceStrip, height: number, read: (t: number) => number): TraceStrip {
  const kept = strip.values.length;
  if (slotsFor(height) <= kept) return strip;
  const grown = createStrip(height);
  if (strip.last === -Infinity) return grown;
  const capacity = grown.values.length;
  const newest = Math.floor(strip.last / READS_PER_SLOT);
  readInto(grown, (newest - capacity + 1) * READS_PER_SLOT, (newest - kept + 1) * READS_PER_SLOT - 1, read);
  for (let slot = newest - kept + 1; slot <= newest; slot++) {
    grown.values[mod(slot, capacity)] = strip.values[mod(slot, kept)];
    grown.times[mod(slot, capacity)] = strip.times[mod(slot, kept)];
  }
  grown.last = strip.last;
  return grown;
}

/** Visits every sample from the pen down the paper with its clock time and signed reading. */
export function walkStrip(strip: TraceStrip, visit: (time: number, value: number) => void): void {
  if (strip.last === -Infinity) return;
  const capacity = strip.values.length;
  const newest = Math.floor(strip.last / READS_PER_SLOT);
  for (let k = 0; k < capacity; k++) {
    const i = mod(newest - k, capacity);
    visit(strip.times[i], strip.values[i]);
  }
}

/** Sideways pen travel in CSS px for a reading in [-1, 1]. */
export function penDeflection(value: number, amplitude: number): number {
  const clamped = Math.max(-1, Math.min(1, value));
  return Math.sign(clamped) * Math.abs(clamped) ** PEN_GAMMA * amplitude;
}

export type ThumperPhase = "ready" | "beating" | "answering";

/**
 * What the thumper control shows at clock time `t`: beating until the worm
 * answers, then the answer itself (`answerSeconds` long). Ready exactly when
 * `thumperReady` is.
 */
export function thumperPhase(t: number, summons: Summons | null, answerSeconds: number): ThumperPhase {
  if (!summons) return "ready";
  if (t < summons.rearAt) return "beating";
  if (t < summons.rearAt + answerSeconds) return "answering";
  return "ready";
}

/** Clock time of the next change of `thumperPhase` after `t`, or null once nothing more is planned. */
export function nextPhaseChange(t: number, summons: Summons | null, answerSeconds: number): number | null {
  if (!summons) return null;
  const changes = [summons.rearAt, summons.rearAt + answerSeconds];
  const next = Math.min(...changes.filter((time) => time > t));
  return next === Infinity ? null : next;
}
