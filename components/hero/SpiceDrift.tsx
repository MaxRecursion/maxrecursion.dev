"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import {
  arcLengthAtX, COMPACT_QUERY, coverTransform, createPath, DESERT_FOCUS, samplePath, SPICE_LANES,
  type Cover, type PathSample,
} from "@/lib/dune-geometry";
import {
  GRAIN_COUNT, HOP_HEIGHT, layoutLanes, LIFT_WINDOW, liftoffChance, liftoffFade, liftoffFlight, saltation, spanFade,
  springStep, surfaceOffset, windFactor, wrapToStart, type Flight, type LaneSpan, type SpiceTrack,
} from "@/lib/spice-flow";
import { getSpiceGust, type SpicePointer } from "@/lib/spice-wind";
import styles from "@/app/home.module.css";
import { watchDensity } from "./watchDensity";

const INK = { dark: "218, 176, 111", light: "139, 88, 38" } as const;
const TAU = Math.PI * 2;
/** Grains are drawn in alpha steps, one fill and one stroke per step. */
const ALPHA_STEPS = 10;
const ALPHA_MAX = 0.8;
/** A streak shows the last tenth of a second of travel, up to 8 px. */
const TRAIL_SECONDS = 0.1;
const TRAIL_MAX = 8;
const TRAIL_WIDTH = 0.3;
const GUST_RADIUS = 110;
/** A passing mouse nudges grains about 7 px; one held still clears a gap of up to about 40 px. */
const GUST_GAIN = 6;
/** Grains leave a crest this much faster than they rode up to it. */
const LIFT_BOOST = 1.3;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

let tracks: readonly SpiceTrack[] | null = null;

/** Every spice lane as a path, built once. */
function getSpiceTracks(): readonly SpiceTrack[] {
  tracks ??= SPICE_LANES.map((lane) => {
    const path = createPath(lane.points);
    return { path, spread: lane.spread, weight: lane.weight, crests: (lane.liftoff ?? []).map((x) => arcLengthAtX(path, x)) };
  });
  return tracks;
}

/** Per-grain state; lane distances in image px, positions in CSS px. */
function createField(count: number) {
  return {
    count,
    lane: new Uint8Array(count),
    /** Arc length along the lane; held at the crest while aloft. */
    s: new Float32Array(count),
    /** Image px/s before the slope of the wind. */
    speed: new Float32Array(count),
    /** 0 rides the contour, 1 the full spread below it. */
    depth: new Float32Array(count),
    phase: new Float32Array(count),
    seed: new Uint32Array(count),
    /** Saltation cycle, image px. */
    hop: new Float32Array(count),
    /** Offset from a crest at which this grain may lift off, image px. */
    crest: new Float32Array(count),
    size: new Float32Array(count),
    alpha: new Float32Array(count),
    /** Seconds since lift-off; negative on the sand. */
    air: new Float32Array(count).fill(-1),
    life: new Float32Array(count),
    rise: new Float32Array(count),
    /** Gust displacement and its velocity. */
    ox: new Float32Array(count),
    oy: new Float32Array(count),
    ovx: new Float32Array(count),
    ovy: new Float32Array(count),
    /** This frame: position, streak vector and alpha step (0 hides the grain). */
    x: new Float32Array(count),
    y: new Float32Array(count),
    trailX: new Float32Array(count),
    trailY: new Float32Array(count),
    step: new Uint8Array(count),
    order: new Uint16Array(count),
  };
}

/** Fine spice grains riding the dune contours; a local gust never captures the pointer. */
export function SpiceDrift({ running }: { running: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = ref.current;
    const hero = canvas?.closest("section");
    if (!canvas || !hero || !running) return;
    return driftSpice(canvas, hero, resolvedTheme === "dark" ? INK.dark : INK.light);
  }, [running, resolvedTheme]);

  return <canvas ref={ref} data-spice-drift data-interacting="false" className={styles.spiceCanvas} />;
}

/** Animates the grains on `canvas` until the returned cleanup runs. */
function driftSpice(canvas: HTMLCanvasElement, hero: HTMLElement, ink: string) {
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;
  const compact = window.matchMedia(COMPACT_QUERY);
  const fills = Array.from({ length: ALPHA_STEPS + 1 }, (_, k) => `rgba(${ink}, ${((ALPHA_MAX * k) / ALPHA_STEPS).toFixed(3)})`);
  const trails = Array.from({ length: ALPHA_STEPS + 1 }, (_, k) => `rgba(${ink}, ${((0.35 * ALPHA_MAX * k) / ALPHA_STEPS).toFixed(3)})`);
  const tally = new Uint16Array(ALPHA_STEPS + 2);
  const sample: PathSample = { x: 0, y: 0, tx: 1, ty: 0 };
  const flight: Flight = { forward: 0, up: 0, vForward: 0, vUp: 0 };
  const pointer: SpicePointer = { x: 0, y: 0, vx: 0, vy: 0, active: false };

  let width = 0;
  let height = 0;
  let cover: Cover = { scale: 1, x: 0, y: 0 };
  let spans: readonly (LaneSpan | null)[] = [];
  let field = createField(0);
  let frame = 0;
  let lastPaint = 0;
  let lastPointerTime = 0;
  // What the last frame drew, so only that area is cleared.
  let left = 0;
  let top = 0;
  let right = 0;
  let bottom = 0;
  let seed = 3917;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const resize = () => {
    const box = canvas.getBoundingClientRect();
    const scene = (canvas.parentElement ?? canvas).getBoundingClientRect();
    width = box.width;
    height = box.height;
    field = createField(0);
    if (!width || !height || !scene.width || !scene.height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, compact.matches ? 1 : 1.5);
    // Reassigning the size wipes the bitmap, so only when it really changes; otherwise clear it,
    // since the dirty rectangle starts over below.
    if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    left = top = right = bottom = 0;

    // The artwork is laid out with object-fit: cover in the parent; map it into this canvas.
    const layout = layoutLanes(
      getSpiceTracks(),
      coverTransform(scene.width, scene.height, compact.matches ? DESERT_FOCUS.compact : DESERT_FOCUS.wide),
      { x: box.left - scene.left, y: box.top - scene.top, width, height },
      compact.matches ? GRAIN_COUNT.compact : GRAIN_COUNT.wide,
    );

    // Fixed seed gives a quiet, repeatable field without hydration-time randomness.
    seed = 3917;
    field = createField(layout.counts.reduce((a, b) => a + b, 0));
    let i = 0;
    layout.counts.forEach((count, lane) => {
      const span = layout.spans[lane];
      for (let k = 0; span && k < count; k++, i++) {
        const depth = random();
        field.lane[i] = lane;
        field.s[i] = span.from + ((span.to - span.from) * (k + random())) / count;
        field.depth[i] = depth;
        // Grains further down the face ride a little slower.
        field.speed[i] = (14 + 24 * random()) * (1 - 0.25 * depth * depth);
        field.hop[i] = field.speed[i] * (0.44 + 0.56 * random());
        field.seed[i] = Math.floor(random() * 0xffffffff);
        field.phase[i] = random() * TAU;
        field.crest[i] = LIFT_WINDOW[0] + random() * (LIFT_WINDOW[1] - LIFT_WINDOW[0]);
        field.size[i] = 0.24 + random() * 0.32;
        field.alpha[i] = 0.22 + random() * 0.36;
      }
    });
    cover = layout.cover;
    spans = layout.spans;
    pointer.active = false;
    canvas.dataset.interacting = "false";
    // Resize observations land after the frame's paint, so draw the new field straight away.
    advance(0);
    draw();
  };

  const move = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") {
      leave();
      return;
    }
    const box = canvas.getBoundingClientRect();
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    if (x < 0 || x > width || y < 0 || y > height) {
      leave();
      return;
    }
    const elapsed = Math.max(16, event.timeStamp - lastPointerTime) / 1000;
    pointer.vx = pointer.active ? clamp((x - pointer.x) / elapsed, -600, 600) : 0;
    pointer.vy = pointer.active ? clamp((y - pointer.y) / elapsed, -600, 600) : 0;
    pointer.x = x;
    pointer.y = y;
    if (!pointer.active) canvas.dataset.interacting = "true";
    pointer.active = true;
    lastPointerTime = event.timeStamp;
  };
  const leave = () => {
    pointer.active = false;
    lastPointerTime = 0;
    canvas.dataset.interacting = "false";
  };

  const advance = (dt: number) => {
    const lanes = getSpiceTracks();
    const { scale } = cover;
    const f = field;
    pointer.vx *= Math.exp(-dt * 4);
    pointer.vy *= Math.exp(-dt * 4);

    for (let i = 0; i < f.count; i++) {
      const lane = lanes[f.lane[i]];
      const span = spans[f.lane[i]];
      if (!span) continue;

      if (f.air[i] < 0) {
        samplePath(lane.path, f.s[i], sample);
        const before = f.s[i];
        let s = before + f.speed[i] * windFactor(sample.ty) * dt;
        for (let c = 0; c < span.crests.length; c++) {
          const crest = span.crests[c] + f.crest[i];
          if (before < crest && s >= crest && random() < liftoffChance(f.depth[i])) {
            s = crest;
            f.air[i] = 0;
            f.life[i] = 0.8 + 0.7 * random();
            f.rise[i] = 8 + 14 * random();
            break;
          }
        }
        if (f.air[i] < 0 && s > span.to) s = wrapToStart(s, span.from, span.to, random() * span.rampIn * 0.5);
        f.s[i] = s;
      } else {
        f.air[i] += dt;
        // Blown away: the grain starts over at the head of its lane.
        if (f.air[i] >= f.life[i]) {
          f.air[i] = -1;
          f.s[i] = span.from - random() * span.rampIn * 0.5;
        }
      }

      // On the sand, just below the contour, skipping along it. Aloft, `s` stays at
      // the crest, so a lifted grain keeps the hop and the light it left with.
      const s = f.s[i];
      samplePath(lane.path, s, sample);
      const hop = saltation(s, f.hop[i], f.seed[i]);
      let x = cover.x + sample.x * scale;
      let y = cover.y + sample.y * scale + surfaceOffset(lane.spread, f.depth[i], s, f.phase[i]) * scale - hop;
      // A grain catches the low sun at the top of a hop.
      let alpha = f.alpha[i] * spanFade(s, span.from, span.to, span.rampIn, span.rampOut) * (1 + (0.3 * hop) / HOP_HEIGHT);
      let vx: number;
      let vy: number;
      if (f.air[i] < 0) {
        const speed = f.speed[i] * windFactor(sample.ty) * scale;
        vx = sample.tx * speed;
        vy = sample.ty * speed;
      } else {
        // Carried downwind and up from where it left the crest, fading out.
        liftoffFlight(f.air[i], f.speed[i] * LIFT_BOOST, f.rise[i], flight);
        x += flight.forward * scale;
        y -= flight.up * scale;
        vx = flight.vForward * scale;
        vy = -flight.vUp * scale;
        alpha *= liftoffFade(f.air[i], f.life[i]);
      }

      let fx = 0;
      let fy = 0;
      const gx = x + f.ox[i];
      const gy = y + f.oy[i];
      if (pointer.active && Math.abs(gx - pointer.x) < GUST_RADIUS && Math.abs(gy - pointer.y) < GUST_RADIUS) {
        const gust = getSpiceGust(gx, gy, pointer, GUST_RADIUS);
        fx = gust.x * GUST_GAIN;
        fy = gust.y * GUST_GAIN;
      }
      if (fx || fy || f.ox[i] || f.oy[i] || f.ovx[i] || f.ovy[i]) {
        springStep(f.ox, f.ovx, i, fx, dt);
        springStep(f.oy, f.ovy, i, fy, dt);
        x += f.ox[i];
        y += f.oy[i];
        vx += f.ovx[i];
        vy += f.ovy[i];
      }

      f.step[i] = Math.max(0, Math.min(ALPHA_STEPS, Math.round((alpha / ALPHA_MAX) * ALPHA_STEPS)));
      if (!f.step[i]) continue;
      // The streak trails behind along the direction of travel.
      const reach = Math.hypot(vx, vy) * TRAIL_SECONDS;
      const trail = TRAIL_SECONDS * (reach > TRAIL_MAX ? TRAIL_MAX / reach : 1);
      f.x[i] = x;
      f.y[i] = y;
      f.trailX[i] = vx * trail;
      f.trailY[i] = vy * trail;
    }
  };

  const draw = () => {
    const f = field;
    if (right > left && bottom > top) context.clearRect(left, top, right - left, bottom - top);
    left = top = Infinity;
    right = bottom = -Infinity;

    // Counting sort by alpha step; afterwards step k occupies order[tally[k - 1]..tally[k]).
    tally.fill(0);
    for (let i = 0; i < f.count; i++) tally[f.step[i] + 1]++;
    for (let k = 1; k < tally.length; k++) tally[k] += tally[k - 1];
    for (let i = 0; i < f.count; i++) f.order[tally[f.step[i]]++] = i;

    context.lineWidth = TRAIL_WIDTH;
    for (let k = 1; k <= ALPHA_STEPS; k++) {
      const from = tally[k - 1];
      const to = tally[k];
      if (from === to) continue;
      context.beginPath();
      for (let j = from; j < to; j++) {
        const i = f.order[j];
        const x = f.x[i];
        const y = f.y[i];
        const reach = Math.hypot(f.trailX[i], f.trailY[i]);
        const ux = reach ? f.trailX[i] / reach : 1;
        const uy = reach ? f.trailY[i] / reach : 0;
        const rx = f.size[i] * 1.4;
        // Start each grain as its own subpath so the grains are not joined up.
        context.moveTo(x + rx * ux, y + rx * uy);
        context.ellipse(x, y, rx, f.size[i] * 0.55, Math.atan2(uy, ux), 0, TAU);
        left = Math.min(left, x, x - f.trailX[i]);
        right = Math.max(right, x, x - f.trailX[i]);
        top = Math.min(top, y, y - f.trailY[i]);
        bottom = Math.max(bottom, y, y - f.trailY[i]);
      }
      context.fillStyle = fills[k];
      context.fill();
      context.beginPath();
      for (let j = from; j < to; j++) {
        const i = f.order[j];
        context.moveTo(f.x[i] - f.trailX[i], f.y[i] - f.trailY[i]);
        context.lineTo(f.x[i], f.y[i]);
      }
      context.strokeStyle = trails[k];
      context.stroke();
    }
    left = Math.floor(left) - 2;
    top = Math.floor(top) - 2;
    right = Math.ceil(right) + 2;
    bottom = Math.ceil(bottom) + 2;
  };

  const paint = (now: number) => {
    // Draw about 30 times a second (with slack so a 60 Hz display paints every other
    // frame); the entire loop is stopped offscreen.
    if (field.count && (!lastPaint || now - lastPaint >= 1000 / 30 - 2)) {
      const dt = lastPaint ? Math.min((now - lastPaint) / 1000, 0.05) : 1 / 30;
      lastPaint = now;
      advance(dt);
      draw();
    }
    frame = window.requestAnimationFrame(paint);
  };

  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  if (canvas.parentElement) observer.observe(canvas.parentElement);
  compact.addEventListener("change", resize);
  const unwatchDensity = watchDensity(resize);
  hero.addEventListener("pointermove", move, { passive: true });
  hero.addEventListener("pointerleave", leave);
  hero.addEventListener("pointercancel", leave);
  window.addEventListener("scroll", leave, { passive: true });
  window.addEventListener("blur", leave);
  frame = window.requestAnimationFrame(paint);
  return () => {
    window.cancelAnimationFrame(frame);
    observer.disconnect();
    compact.removeEventListener("change", resize);
    unwatchDensity();
    hero.removeEventListener("pointermove", move);
    hero.removeEventListener("pointerleave", leave);
    hero.removeEventListener("pointercancel", leave);
    window.removeEventListener("scroll", leave);
    window.removeEventListener("blur", leave);
    leave();
    context.clearRect(0, 0, width, height);
  };
}
