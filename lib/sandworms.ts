/**
 * Three sandworms crossing the dunes. The choreography is a pure function of
 * one clock (seconds), so the canvas renderer and the wormsign seismograph
 * read the same worms without sharing state. Distances are image pixels along
 * a worm's lane (`WORM_LANES` in dune-geometry), heights are body radii above
 * the sand line, and a worm is hidden wherever it sits below that line.
 *
 * This module has no runtime imports, so the Node test runner can load it.
 */
import type { WormLaneId } from "./dune-geometry";

export type WormId = "shai-hulud" | "east" | "west";

export type WormSpec = {
  id: WormId;
  lane: WormLaneId;
  /** Body radius and length in image px. Shai-Hulud is twice the size of the others. */
  radius: number;
  length: number;
  /** Image px per second along the lane. */
  speed: number;
  /** Seconds from one pass to the next; the remainder after a pass is spent submerged. */
  period: number;
  /** Seconds into a pass at clock time zero. */
  start: number;
  /** Humps fixed to the ground that the body slides through. Wavelength in px, the rest in radii. */
  hump: { wavelength: number; amplitude: number; sink: number; phase: number };
  /** Resting head lift above the sand, in radii. */
  lift: number;
  /** One slow rear-up per pass, when the head reaches this fraction of the lane. */
  rear: { at: number; height: number };
  /** Weight on the seismograph: size and distance. */
  tremor: number;
};

export const WORMS: readonly WormSpec[] = [
  {
    id: "shai-hulud",
    lane: "ridge",
    radius: 13,
    length: 300,
    speed: 13,
    period: 82,
    start: 9,
    hump: { wavelength: 180, amplitude: 1.2, sink: 0.42, phase: 0.6 },
    lift: 1.1,
    rear: { at: 0.4, height: 3.6 },
    tremor: 1,
  },
  {
    id: "east",
    lane: "peak",
    radius: 6.5,
    length: 150,
    speed: 9,
    period: 72,
    start: 22,
    hump: { wavelength: 92, amplitude: 1.2, sink: 0.4, phase: 2.1 },
    lift: 1,
    rear: { at: 0.3, height: 3 },
    tremor: 0.42,
  },
  {
    id: "west",
    lane: "horizon",
    radius: 6.5,
    length: 150,
    speed: 9,
    // The same period as the east worm and half of it behind, so the two never meet near the peak.
    period: 72,
    start: 22 - 36,
    hump: { wavelength: 96, amplitude: 1.2, sink: 0.4, phase: 4.4 },
    lift: 1,
    rear: { at: 0.55, height: 2.8 },
    tremor: 0.42,
  },
];

/** A worm's spec placed on its lane (lengths in image px). */
export type WormRoute = {
  spec: WormSpec;
  /** Lane arc length. */
  length: number;
  /** Lane arc length beyond which the head has left the artwork. */
  visibleTo: number;
};

/** One pass: the head leaves `entry` at clock `start` and swims to the lane's end. */
type Pass = { start: number; entry: number };

/** What a planted thumper does to Shai-Hulud. */
export type Summons = {
  planted: number;
  /** Clock time the rear-up begins. */
  rearAt: number;
  /** Regular passes start at `anchor + k * period` outside a breach. */
  anchor: number;
  /** When the worm was out of sight it bursts from the sand mid-lane instead. */
  breach: { start: number; entry: number; end: number; after: number } | null;
  /** An earlier breach still swimming when this thumper was planted; it dives before the new one. */
  prior: Pass | null;
};

export type WormPose = {
  /** Head position along the lane. Negative or past the lane end when submerged. */
  head: number;
  /** Where the body surfaced this pass. */
  entry: number;
  /** Head lift in radii and mouth opening 0–1. */
  lift: number;
  mouth: number;
  /** 0–1 rear-up envelope (largest of the pass rear and a summons). */
  rearing: number;
  /** Radii the whole body is pulled under while it dives to answer a thumper. */
  sink: number;
  active: boolean;
};

const TAU = Math.PI * 2;
/** Seconds a still-visible pass takes to dive out of sight when a thumper calls it elsewhere. */
const DIVE = 1.4;
const REAR = { rise: 2.4, hold: 1.8, fall: 2.6 };
const SUMMONED = { rise: 1.3, hold: 2.6, fall: 2.4, height: 4.4 };
/** Thumps begin at planting; the worm answers no sooner than this. */
export const THUMP_LEAD = 3.2;
export const THUMP_INTERVAL = 0.8;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoothstep = (from: number, to: number, value: number) => {
  const t = clamp01((value - from) / (to - from));
  return t * t * (3 - 2 * t);
};
const mod = (value: number, size: number) => ((value % size) + size) % size;
/** A smooth maximum, so the neck blends into the humps without a crease. */
const smoothMax = (a: number, b: number, k: number) => (a + b + Math.sqrt((a - b) * (a - b) + k * k)) / 2;

function envelope(dt: number, { rise, hold, fall }: { rise: number; hold: number; fall: number }) {
  if (dt <= 0 || dt >= rise + hold + fall) return 0;
  if (dt < rise) return smoothstep(0, rise, dt);
  if (dt < rise + hold) return 1;
  return 1 - smoothstep(rise + hold, rise + hold + fall, dt);
}

export const rearDuration = REAR.rise + REAR.hold + REAR.fall;
export const summonedDuration = SUMMONED.rise + SUMMONED.hold + SUMMONED.fall;

/** Seconds a pass lasts: the head swims the lane plus one body length, so the tail clears it. */
export function passDuration(route: WormRoute, entry = 0) {
  return (route.length + route.spec.length - entry) / route.spec.speed;
}

/** At least a short rest, even if a lane is longer than its spec's period allows. */
export function wormPeriod(route: WormRoute) {
  return Math.max(route.spec.period, passDuration(route) + 2);
}

function regularPass(route: WormRoute, t: number, anchor: number): Pass {
  const period = wormPeriod(route);
  return { start: t - mod(t - anchor, period), entry: 0 };
}

function currentPass(route: WormRoute, t: number, summons?: Summons | null): Pass {
  const regularAnchor = -route.spec.start;
  if (route.spec.id !== "shai-hulud" || !summons) return regularPass(route, t, regularAnchor);
  const { breach, prior } = summons;
  if (breach && t >= breach.start && t < breach.end) return { start: breach.start, entry: breach.entry };
  if (breach && prior && t >= prior.start && t < breach.start) return prior;
  return regularPass(route, t, breach && t >= breach.end ? breach.after : summons.anchor);
}

/** Arc length window in which the head is on screen and clear of the sand at the lane's ends. */
function headWindow(route: WormRoute) {
  return { from: route.spec.radius * 3, to: route.visibleTo - route.spec.radius * 2 };
}

export function wormPose(route: WormRoute, t: number, summons?: Summons | null): WormPose {
  const { spec } = route;
  const pass = currentPass(route, t, summons);
  const elapsed = t - pass.start;
  const active = elapsed < passDuration(route, pass.entry);
  const head = active ? pass.entry + elapsed * spec.speed : route.length + spec.length + spec.radius * 4;

  // A worm that has just breached for a thumper skips its routine rear-up.
  const passRear = active && pass.entry === 0
    ? envelope(t - (pass.start + (spec.rear.at * route.length) / spec.speed), REAR)
    : 0;
  const called = spec.id === "shai-hulud" && summons ? envelope(t - summons.rearAt, SUMMONED) : 0;
  const phase = spec.hump.phase;
  const bob = 0.2 * Math.sin((TAU * t) / 5.3 + phase) + 0.08 * Math.sin((TAU * t) / 2.3 + phase * 2);
  const lift = spec.lift + bob + Math.max(
    passRear * (spec.rear.height - spec.lift),
    called * (SUMMONED.height - spec.lift),
  );
  const rearing = Math.max(passRear, called);
  const breathing = 0.07 * (1 + Math.sin((TAU * t) / 3.1 + phase));
  // Called to breach elsewhere, a pass still in view dives first.
  const breach = spec.id === "shai-hulud" ? summons?.breach : null;
  const diving = breach && summons && t >= summons.planted && t < breach.start
    ? smoothstep(summons.planted, summons.planted + DIVE, t)
    : 0;
  return {
    head,
    entry: pass.entry,
    lift,
    mouth: clamp01(0.08 + breathing + 0.92 * rearing),
    rearing,
    sink: 4.5 * diving,
    active,
  };
}

/**
 * Height of the spine (radii above the sand line) at lane arc length `s` for
 * a body whose head is at `pose.head`. Below −1 the whole body is buried.
 */
export function spineHeight(route: WormRoute, pose: WormPose, s: number): number {
  const { spec } = route;
  const u = (pose.head - s) / spec.length; // 0 at the head, 1 at the tail
  if (u < 0 || u > 1) return -8;
  const { wavelength, amplitude, sink, phase } = spec.hump;
  const humps = amplitude * Math.sin((TAU * s) / wavelength + phase) - sink;
  // The neck carries the head up out of the sand and hands over to the humps behind it.
  const neck = pose.lift + (-6 - pose.lift) * smoothstep(0, 0.2 + 0.08 * pose.rearing, u);
  let height = smoothMax(humps, neck, 0.6);
  height -= 1.5 * smoothstep(0.72, 1, u);
  // Burrowed at the point it surfaced and at the end of the lane.
  const ramp = Math.max(wavelength * 0.55, spec.radius * 5);
  height -= 3.2 * (1 - smoothstep(pose.entry, pose.entry + ramp, s));
  height -= 3.2 * smoothstep(route.length - ramp, route.length, s);
  return height - pose.sink;
}

/** Body radius multiplier along the body: a flared mouth, a long trunk and a narrowing tail. */
export function bodyRadius(u: number): number {
  if (u < 0.05) return 1.06 - 0.06 * smoothstep(0, 0.05, u);
  return 1 - 0.55 * smoothstep(0.62, 1, u);
}

/**
 * Plan Shai-Hulud's answer to a thumper planted at `planted`. If its head is
 * on screen it rears up where it is; otherwise whatever still shows dives
 * and the worm bursts out of the sand mid-ridge a moment later.
 */
export function planThumper(route: WormRoute, planted: number, previous?: Summons | null): Summons {
  if (previous && !thumperReady(planted, previous)) return previous;
  const { spec } = route;
  // A worm can be called again while it is still swimming away from its last breach.
  const swimming = previous?.breach && planted < previous.breach.end ? previous.breach : null;
  const anchor = previous?.breach && !swimming ? previous.breach.after : previous?.anchor ?? -spec.start;
  const window = headWindow(route);
  const reach = summonedDuration * spec.speed;
  const pass = currentPass(route, planted, previous);
  const active = wormPose(route, planted, previous).active;

  // Head on screen (or about to be): rear up where it is.
  const earliest = planted + THUMP_LEAD;
  const surfaced = pass.start + (window.from - pass.entry) / spec.speed;
  const rearAt = active ? Math.max(earliest, surfaced) : earliest;
  const pose = wormPose(route, rearAt, previous);
  if (pose.active && rearAt - earliest < 4 && pose.head >= window.from && pose.head + reach * 0.5 <= window.to) {
    return { planted, rearAt, anchor, breach: swimming, prior: null };
  }

  // Otherwise burst out mid-ridge once any part of it still showing has dived.
  const entry = Math.min(route.length * 0.28, window.to - reach - spec.radius * 4);
  const lead = 1.1; // seconds between the head breaking the surface and the rear-up
  const start = Math.max(earliest - lead, planted + DIVE + 0.2);
  const end = start + passDuration(route, entry);
  return {
    planted,
    rearAt: start + lead,
    anchor,
    breach: { start, entry, end, after: end + wormPeriod(route) - passDuration(route) },
    prior: swimming ? { start: swimming.start, entry: swimming.entry } : null,
  };
}

/** The thumper can be planted again as soon as the worm has finished answering. */
export function thumperReady(t: number, summons?: Summons | null): boolean {
  return !summons || t >= summons.rearAt + summonedDuration;
}

function tremorNoise(t: number, seed: number) {
  return 0.55 * Math.sin(TAU * 3.1 * t + seed)
    + 0.3 * Math.sin(TAU * 5.3 * t + seed * 2.3)
    + 0.15 * Math.sin(TAU * 8.9 * t + seed * 3.7);
}

/** How much of a worm's body is out of its burrow ramps (0–1). */
function emergence(route: WormRoute, pose: WormPose) {
  if (!pose.active) return 0;
  const { spec } = route;
  const ramp = Math.max(spec.hump.wavelength * 0.55, spec.radius * 5);
  const out = clamp01((pose.head - pose.entry) / (ramp * 2));
  const tail = pose.head - spec.length;
  return out * clamp01((route.length - tail) / (ramp * 2));
}

export type Wormsign = {
  /** Signed trace deflection, −1 to 1. */
  value: number;
  /** Unsigned activity, 0 to roughly 1. */
  level: number;
  /** 0–1 while a thumper is beating. */
  thump: number;
};

/** The seismograph reading: tremor from each surfaced worm plus thumper beats. */
export function wormsignAt(routes: readonly WormRoute[], t: number, summons?: Summons | null): Wormsign {
  let value = 0.05 * Math.sin(TAU * 0.7 * t) * Math.sin(TAU * 1.9 * t + 1);
  let level = 0;
  routes.forEach((route, i) => {
    const pose = wormPose(route, t, summons);
    const energy = route.spec.tremor * (pose.active ? 0.2 + 0.5 * emergence(route, pose) + 0.6 * pose.rearing : 0);
    value += 0.6 * energy * tremorNoise(t, i * 1.7 + 0.4);
    level += energy;
  });

  let thump = 0;
  if (summons && t >= summons.planted && t < summons.rearAt) {
    const since = t - summons.planted;
    const beat = since - Math.floor(since / THUMP_INTERVAL) * THUMP_INTERVAL;
    thump = Math.exp(-beat * 9);
    value += 0.7 * thump * Math.cos(TAU * 6 * beat);
    level += 0.4 * thump;
  }
  return { value: Math.tanh(value * 1.4), level: Math.min(1.5, level), thump };
}
