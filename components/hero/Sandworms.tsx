"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { COMPACT_QUERY, DESERT_FOCUS, coverTransform, samplePath, type Cover, type PathSample } from "@/lib/dune-geometry";
import { bodyRadius, spineHeight, wormPose, type WormId, type WormPose } from "@/lib/sandworms";
import styles from "@/app/home.module.css";
import { getSummons } from "./thumper";
import { getWormTracks, wormClock, type WormTrack } from "./wormTracks";

/** Spine samples per worm, head to tail: enough for several per body ring. */
const SAMPLES = 180;
/** Radii between the rings of the body; each segment swells a little. */
const RING_SPACING = 0.62;
const SWELL = 0.08;
/** Rim-light opacity is quantised so each edge is a handful of strokes. */
const RIM_LEVELS = 6;
const TEETH = 26;
const MAX_GRAINS = 260;
/** Reduced motion: a composed still, each worm at a moment it is well out of the sand. */
const STILL: Record<WormId, number> = { "shai-hulud": 15.5, east: 2, west: 34 };
/** The horizon glow sits low on the right, so rim light comes from the upper right. */
const LIGHT_X = 0.6;
const LIGHT_Y = -0.8;

type Palette = {
  body: string;
  shade: string;
  lit: string;
  rim: string;
  groove: string;
  lip: string;
  throat: string;
  ember: string;
  teeth: string;
  sand: string;
  haze: string;
};

const PALETTES: Record<"dark" | "light", Palette> = {
  dark: {
    body: "#21160f",
    shade: "#110a06",
    lit: "#4d3320",
    rim: "#e0a462",
    groove: "#0c0704",
    lip: "#3a2618",
    throat: "#060302",
    ember: "#45180a",
    teeth: "#b9a685",
    sand: "196, 146, 90",
    haze: "#5e4029",
  },
  light: {
    body: "#3b2a1c",
    shade: "#24180f",
    lit: "#6e4d30",
    rim: "#c98a46",
    groove: "#1a110a",
    lip: "#5a3d27",
    throat: "#0d0805",
    ember: "#5a2410",
    teeth: "#efe0c0",
    sand: "150, 98, 46",
    haze: "#8a6a4c",
  },
};

type Spine = {
  x: Float32Array;
  y: Float32Array;
  gx: Float32Array;
  gy: Float32Array;
  nx: Float32Array;
  ny: Float32Array;
  tx: Float32Array;
  ty: Float32Array;
  r: Float32Array;
  /** Radius including the swell of each ring segment. */
  w: Float32Array;
  /** 0 at a groove between rings, 1 mid-segment. */
  swell: Float32Array;
  h: Float32Array;
  arc: Float32Array;
};

const createSpine = (): Spine => ({
  x: new Float32Array(SAMPLES + 1),
  y: new Float32Array(SAMPLES + 1),
  gx: new Float32Array(SAMPLES + 1),
  gy: new Float32Array(SAMPLES + 1),
  nx: new Float32Array(SAMPLES + 1),
  ny: new Float32Array(SAMPLES + 1),
  tx: new Float32Array(SAMPLES + 1),
  ty: new Float32Array(SAMPLES + 1),
  r: new Float32Array(SAMPLES + 1),
  w: new Float32Array(SAMPLES + 1),
  swell: new Float32Array(SAMPLES + 1),
  h: new Float32Array(SAMPLES + 1),
  arc: new Float32Array(SAMPLES + 1),
});

/** Grains of sand thrown up where a body breaks the surface or pours off a rearing head. */
type Grains = {
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  age: Float32Array;
  life: Float32Array;
  floor: Float32Array;
  size: Float32Array;
  count: number;
};

const createGrains = (): Grains => ({
  x: new Float32Array(MAX_GRAINS),
  y: new Float32Array(MAX_GRAINS),
  vx: new Float32Array(MAX_GRAINS),
  vy: new Float32Array(MAX_GRAINS),
  age: new Float32Array(MAX_GRAINS),
  life: new Float32Array(MAX_GRAINS),
  floor: new Float32Array(MAX_GRAINS),
  size: new Float32Array(MAX_GRAINS),
  count: 0,
});

function mixHex(a: string, b: string, amount: number) {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const mixed = [0, 1, 2].map((i) => Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * amount));
  return `rgb(${mixed.join(", ")})`;
}

/**
 * Two small sandworms and Shai-Hulud, twice their size, swimming through the
 * dune crests. Each body follows its lane with world-fixed humps, segmented
 * rings and a toothed maw that opens as it rears. Drawn only on the right,
 * clear of the headline, and paused whenever the hero is not visible.
 */
export function Sandworms({ running, still }: { running: boolean; still: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    const hero = canvas?.closest("section");
    if (!canvas || !host || !hero || (!running && !still)) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const compactQuery = window.matchMedia(COMPACT_QUERY);
    const palette = PALETTES[resolvedTheme === "dark" ? "dark" : "light"];
    const tracks = getWormTracks();
    const spines = tracks.map(createSpine);
    const grains = createGrains();
    const ground: PathSample = { x: 0, y: 0, tx: 1, ty: 0 };
    const sandStyles = Array.from({ length: 6 }, (_, i) => `rgba(${palette.sand}, ${((i + 1) / 6) * 0.85})`);
    const tones = tracks.map((track) => {
      // Far worms take on the colour of the haze around them.
      const haze = track.spec.id === "shai-hulud" ? 0 : 0.32;
      return {
        body: mixHex(palette.body, palette.haze, haze),
        shade: mixHex(palette.shade, palette.haze, haze),
        lit: mixHex(palette.lit, palette.haze, haze * 0.6),
        groove: mixHex(palette.groove, palette.haze, haze),
        lip: mixHex(palette.lip, palette.haze, haze),
      };
    });

    let width = 0;
    let height = 0;
    let cover: Cover = { scale: 1, x: 0, y: 0 };
    let offsetX = 0;
    let offsetY = 0;
    let frame = 0;
    let lastPaint = 0;
    let seed = 7919;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    /** Fade the worms out before they could ever sit beside the headline text. */
    const keepClearOfText = () => {
      let right = 0;
      const range = document.createRange();
      const walker = document.createTreeWalker(hero.querySelector("h1")?.parentElement ?? hero, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent?.trim() || (node.parentElement && node.parentElement.closest(".sr-only"))) continue;
        range.selectNodeContents(node);
        for (const rect of range.getClientRects()) right = Math.max(right, rect.right);
      }
      const start = Math.max(0, right - canvas.getBoundingClientRect().left + 48);
      const mask = `linear-gradient(90deg, transparent ${start}px, #000 ${start + 110}px)`;
      canvas.style.maskImage = mask;
      canvas.style.setProperty("-webkit-mask-image", mask);
    };

    const resize = () => {
      // Layout sizes, so a transformed ancestor never inflates the bitmap.
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      if (!width || !height) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      cover = coverTransform(host.clientWidth, host.clientHeight, compactQuery.matches ? DESERT_FOCUS.compact : DESERT_FOCUS.wide);
      offsetX = canvas.offsetLeft;
      offsetY = canvas.offsetTop;
      grains.count = 0;
      keepClearOfText();
    };

    const buildSpine = (track: WormTrack, pose: WormPose, spine: Spine) => {
      const { spec, path } = track;
      const eastward = path.xs[path.xs.length - 1] > path.xs[0];
      for (let k = 0; k <= SAMPLES; k++) {
        const u = k / SAMPLES;
        const s = pose.head - u * spec.length;
        samplePath(path, s, ground);
        // The sand's upward normal; lanes run either way.
        const nx = eastward ? ground.ty : -ground.ty;
        const ny = eastward ? -ground.tx : ground.tx;
        const h = spineHeight(track, pose, s);
        spine.h[k] = h;
        spine.gx[k] = cover.x + ground.x * cover.scale - offsetX;
        spine.gy[k] = cover.y + ground.y * cover.scale - offsetY;
        spine.x[k] = spine.gx[k] + nx * h * spec.radius * cover.scale;
        spine.y[k] = spine.gy[k] + ny * h * spec.radius * cover.scale;
        spine.r[k] = spec.radius * bodyRadius(u) * cover.scale;
      }
      spine.arc[0] = 0;
      for (let k = 0; k <= SAMPLES; k++) {
        const a = Math.max(0, k - 1);
        const b = Math.min(SAMPLES, k + 1);
        // Tangent towards the head; the normal keeps one side per worm so it never flips.
        let tx = spine.x[a] - spine.x[b];
        let ty = spine.y[a] - spine.y[b];
        const length = Math.hypot(tx, ty) || 1;
        tx /= length;
        ty /= length;
        spine.tx[k] = tx;
        spine.ty[k] = ty;
        spine.nx[k] = eastward ? ty : -ty;
        spine.ny[k] = eastward ? -tx : tx;
        if (k > 0) spine.arc[k] = spine.arc[k - 1] + Math.hypot(spine.x[k] - spine.x[k - 1], spine.y[k] - spine.y[k - 1]);
        // Rings are measured from the head, so they travel with the body through the humps.
        const swell = Math.sin((Math.PI * spine.arc[k]) / (RING_SPACING * spec.radius * cover.scale)) ** 2;
        spine.swell[k] = swell;
        spine.w[k] = spine.r[k] * (1 + SWELL * (swell - 0.5));
      }
    };

    const clipToSand = (spine: Spine, radius: number) => {
      // Everything below the crest line is inside the dune.
      context.beginPath();
      const reach = radius * 8;
      const fx = spine.gx[0] + (spine.gx[0] - spine.gx[1]) / Math.max(1e-3, Math.hypot(spine.gx[0] - spine.gx[1], spine.gy[0] - spine.gy[1])) * reach;
      const fy = spine.gy[0] + (spine.gy[0] - spine.gy[1]) / Math.max(1e-3, Math.hypot(spine.gx[0] - spine.gx[1], spine.gy[0] - spine.gy[1])) * reach;
      context.moveTo(fx, -height);
      context.lineTo(fx, fy);
      for (let k = 0; k <= SAMPLES; k++) context.lineTo(spine.gx[k], spine.gy[k]);
      const last = SAMPLES;
      const bx = spine.gx[last] + (spine.gx[last] - spine.gx[last - 1]) * 6;
      const by = spine.gy[last] + (spine.gy[last] - spine.gy[last - 1]) * 6;
      context.lineTo(bx, by);
      context.lineTo(bx, -height);
      context.closePath();
      context.clip();
    };

    const drawBody = (spine: Spine, tone: (typeof tones)[number], radius: number) => {
      // A dark, matte silhouette that swells slightly between its rings.
      const body = new Path2D();
      for (let k = 0; k <= SAMPLES; k++) body.lineTo(spine.x[k] + spine.nx[k] * spine.w[k], spine.y[k] + spine.ny[k] * spine.w[k]);
      for (let k = SAMPLES; k >= 0; k--) body.lineTo(spine.x[k] - spine.nx[k] * spine.w[k], spine.y[k] - spine.ny[k] * spine.w[k]);
      body.closePath();
      context.fillStyle = tone.body;
      context.fill(body);

      context.save();
      context.clip(body);
      context.lineJoin = "round";
      context.lineCap = "round";
      // The belly sinks into shadow; the back catches a little sky.
      const band = (offset: number, width: number, colour: string, alpha: number) => {
        context.beginPath();
        for (let k = 0; k <= SAMPLES; k++) context.lineTo(spine.x[k] + spine.nx[k] * spine.r[k] * offset, spine.y[k] + spine.ny[k] * spine.r[k] * offset);
        context.globalAlpha = alpha;
        context.strokeStyle = colour;
        context.lineWidth = radius * width;
        context.stroke();
      };
      band(-0.62, 0.9, tone.shade, 0.7);
      band(0.42, 0.7, tone.lit, 0.12);

      // Each ring segment bulges, so its sheen is brightest between the grooves.
      context.strokeStyle = tone.lit;
      context.lineWidth = radius * 0.46;
      for (let level = 1; level <= 3; level++) {
        context.beginPath();
        for (let k = 0; k < SAMPLES; k++) {
          if (Math.ceil(spine.swell[k] * 3 - 0.6) !== level) continue;
          context.moveTo(spine.x[k] + spine.nx[k] * spine.r[k] * 0.48, spine.y[k] + spine.ny[k] * spine.r[k] * 0.48);
          context.lineTo(spine.x[k + 1] + spine.nx[k + 1] * spine.r[k + 1] * 0.48, spine.y[k + 1] + spine.ny[k + 1] * spine.r[k + 1] * 0.48);
        }
        context.globalAlpha = 0.08 * level;
        context.stroke();
      }

      // Grooves between the rings, curving round the body.
      const spacing = RING_SPACING * radius;
      context.beginPath();
      let k = 0;
      for (let d = spacing * 2; d < spine.arc[SAMPLES] * 0.98; d += spacing) {
        while (k < SAMPLES - 1 && spine.arc[k + 1] < d) k++;
        const f = (d - spine.arc[k]) / Math.max(1e-3, spine.arc[k + 1] - spine.arc[k]);
        const x = spine.x[k] + (spine.x[k + 1] - spine.x[k]) * f;
        const y = spine.y[k] + (spine.y[k + 1] - spine.y[k]) * f;
        const r = spine.w[k] + (spine.w[k + 1] - spine.w[k]) * f;
        context.moveTo(x + spine.nx[k] * r, y + spine.ny[k] * r);
        context.quadraticCurveTo(x - spine.tx[k] * r * 0.38, y - spine.ty[k] * r * 0.38, x - spine.nx[k] * r, y - spine.ny[k] * r);
      }
      context.globalAlpha = 0.5;
      context.strokeStyle = tone.groove;
      context.lineWidth = Math.max(0.55, radius * 0.065);
      context.stroke();

      // Sand caught in the hide, fixed to each ring so it travels with the body.
      context.fillStyle = `rgb(${palette.sand})`;
      context.globalAlpha = 0.14;
      context.beginPath();
      k = 0;
      const dot = Math.max(0.6, radius * 0.06);
      for (let ring = 2; ring * spacing < spine.arc[SAMPLES] * 0.95; ring++) {
        for (let speck = 0; speck < 3; speck++) {
          const hash = Math.sin(ring * 12.9898 + speck * 78.233) * 43758.5453;
          const along = hash - Math.floor(hash);
          const across = (hash * 7.13) - Math.floor(hash * 7.13);
          const d = (ring + along) * spacing;
          while (k < SAMPLES - 1 && spine.arc[k + 1] < d) k++;
          const lift = (0.15 + 0.75 * across) * spine.r[k];
          context.rect(spine.x[k] + spine.nx[k] * lift, spine.y[k] + spine.ny[k] * lift, dot, dot);
        }
      }
      context.fill();

      // Rim light on whichever edge faces the horizon glow, brightest on each ring's swell.
      context.strokeStyle = palette.rim;
      context.lineWidth = Math.max(0.6, radius * 0.09);
      for (const side of [1, -1]) {
        for (let level = 1; level <= RIM_LEVELS; level++) {
          context.beginPath();
          let drawn = false;
          for (let j = 0; j < SAMPLES; j++) {
            const facing = side * (spine.nx[j] * LIGHT_X + spine.ny[j] * LIGHT_Y);
            if (facing <= 0) continue;
            const strength = Math.pow(facing, 1.4) * (0.6 + 0.4 * spine.swell[j]);
            if (Math.round(strength * RIM_LEVELS) !== level) continue;
            const r0 = spine.w[j] * 0.9;
            const r1 = spine.w[j + 1] * 0.9;
            context.moveTo(spine.x[j] + side * spine.nx[j] * r0, spine.y[j] + side * spine.ny[j] * r0);
            context.lineTo(spine.x[j + 1] + side * spine.nx[j + 1] * r1, spine.y[j + 1] + side * spine.ny[j + 1] * r1);
            drawn = true;
          }
          if (!drawn) continue;
          context.globalAlpha = 0.62 * (level / RIM_LEVELS);
          context.stroke();
        }
      }
      context.restore();
    };

    const drawMouth = (spine: Spine, tone: (typeof tones)[number], pose: WormPose) => {
      const open = pose.mouth;
      const r0 = spine.r[0] * (1 + 0.14 * open);
      const cx = spine.x[0] + spine.tx[0] * r0 * 0.1;
      const cy = spine.y[0] + spine.ty[0] * r0 * 0.1;
      // The maw seen three-quarters on: rounder as the head lifts towards us.
      const depth = 0.32 + 0.34 * open;
      const angle = Math.atan2(spine.ny[0], spine.nx[0]);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const at = (phi: number, a: number, b: number) => {
        const ex = Math.cos(phi) * a;
        const ey = Math.sin(phi) * b;
        return [cx + ex * cos - ey * sin, cy + ex * sin + ey * cos] as const;
      };

      // Lip, with the light catching its upper edge.
      context.fillStyle = tone.lip;
      context.beginPath();
      context.ellipse(cx, cy, r0, r0 * depth, angle, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = palette.rim;
      context.globalAlpha = 0.6;
      context.lineWidth = Math.max(0.6, r0 * 0.09);
      context.beginPath();
      context.ellipse(cx, cy, r0 * 0.96, r0 * depth * 0.96, angle, Math.PI * 1.1, Math.PI * 1.9);
      context.stroke();
      context.globalAlpha = 1;

      // A deep throat with a faint ember glow.
      const inner = 0.2 + 0.66 * open;
      const ia = r0 * inner;
      const ib = r0 * depth * inner;
      const throat = context.createRadialGradient(cx, cy, 0, cx, cy, ia);
      throat.addColorStop(0, palette.ember);
      throat.addColorStop(0.55, palette.throat);
      throat.addColorStop(1, palette.throat);
      context.fillStyle = throat;
      context.beginPath();
      context.ellipse(cx, cy, ia, ib, angle, 0, Math.PI * 2);
      context.fill();

      if (open > 0.12) {
        // Rings of crystal teeth pointing into the throat, long and short in turn.
        context.fillStyle = palette.teeth;
        context.globalAlpha = Math.min(0.6, 0.12 + open * 0.5);
        context.beginPath();
        const half = (Math.PI / TEETH) * 0.5;
        for (let i = 0; i < TEETH; i++) {
          const theta = (i / TEETH) * Math.PI * 2;
          const reach = (i % 2 ? 0.16 : 0.3 + 0.06 * Math.sin(i * 2.4)) * (0.5 + 0.5 * open);
          const [ax, ay] = at(theta - half, ia, ib);
          const [bx, by] = at(theta + half, ia, ib);
          const [px, py] = at(theta, ia * (1 - reach), ib * (1 - reach));
          context.moveTo(ax, ay);
          context.lineTo(px, py);
          context.lineTo(bx, by);
          context.closePath();
        }
        context.fill();
        context.globalAlpha = 1;
      } else {
        // Closed, the three lips meet in a seam.
        context.strokeStyle = tone.groove;
        context.globalAlpha = 0.8;
        context.lineWidth = Math.max(0.5, r0 * 0.08);
        context.beginPath();
        for (const phi of [Math.PI / 2, (Math.PI * 7) / 6, (Math.PI * 11) / 6]) {
          const [x, y] = at(phi, r0 * 0.78, r0 * depth * 0.78);
          context.moveTo(cx, cy);
          context.lineTo(x, y);
        }
        context.stroke();
        context.globalAlpha = 1;
      }
    };

    /** Sand heaped where the body breaks the surface, so it burrows rather than sits on the line. */
    const drawBerms = (spine: Spine, radius: number) => {
      for (let k = 1; k <= SAMPLES; k++) {
        if ((spine.h[k - 1] + 1 > 0) === (spine.h[k] + 1 > 0)) continue;
        const x = spine.gx[k];
        const y = spine.gy[k];
        const mound = context.createRadialGradient(x, y, 0, x, y, radius * 1.25);
        mound.addColorStop(0, `rgba(${palette.sand}, 0.42)`);
        mound.addColorStop(1, `rgba(${palette.sand}, 0)`);
        context.fillStyle = mound;
        context.beginPath();
        context.ellipse(x, y, radius * 1.25, radius * 0.45, Math.atan2(spine.gy[k] - spine.gy[k - 1], spine.gx[k] - spine.gx[k - 1]), 0, Math.PI * 2);
        context.fill();
      }
    };

    const spawn = (x: number, y: number, vx: number, vy: number, floor: number, size: number) => {
      if (grains.count >= MAX_GRAINS) return;
      const i = grains.count++;
      grains.x[i] = x;
      grains.y[i] = y;
      grains.vx[i] = vx;
      grains.vy[i] = vy;
      grains.age[i] = 0;
      grains.life[i] = 0.7 + random() * 0.9;
      grains.floor[i] = floor;
      grains.size[i] = size;
    };

    const throwSand = (track: WormTrack, spine: Spine, pose: WormPose, dt: number) => {
      const radius = track.spec.radius * cover.scale;
      const grainSize = Math.max(0.7, radius * 0.09);
      const rate = track.spec.id === "shai-hulud" ? 1 : 0.55;
      for (let k = 1; k <= SAMPLES; k++) {
        // Where the top of the body breaks the surface, sand sprays up.
        const before = spine.h[k - 1] + 0.6;
        const after = spine.h[k] + 0.6;
        if ((before > 0) === (after > 0)) continue;
        if (random() > dt * 26 * rate) continue;
        const x = spine.gx[k] + (random() - 0.5) * radius;
        const y = spine.gy[k] - random() * radius * 0.3;
        spawn(x, y, spine.tx[k] * radius * (random() * 2 - 0.6), -radius * (1.4 + random() * 2.2), spine.gy[k], grainSize);
      }
      // Sand pours off a lifted head and neck.
      const lifted = Math.max(0, pose.lift - 1.4) / 3;
      if (lifted > 0 && random() < dt * 40 * rate * lifted) {
        const k = Math.floor(random() * SAMPLES * 0.22);
        const side = random() < 0.5 ? 1 : -1;
        spawn(
          spine.x[k] + side * spine.nx[k] * spine.r[k],
          spine.y[k] + side * spine.ny[k] * spine.r[k],
          side * spine.nx[k] * radius * 0.6,
          radius * 0.2,
          spine.gy[k],
          grainSize,
        );
      }
      // A plume ahead of a head ploughing along the surface.
      if (spine.h[0] < 1.8 && spine.h[0] > -0.8 && random() < dt * 18 * rate) {
        spawn(
          spine.x[0] + spine.tx[0] * spine.r[0],
          spine.gy[0] - radius * 0.1,
          spine.tx[0] * radius * (1.5 + random() * 2),
          -radius * (1 + random() * 1.6),
          spine.gy[0],
          grainSize,
        );
      }
    };

    const drawGrains = (dt: number) => {
      const gravity = 70 * cover.scale;
      let alive = 0;
      for (let i = 0; i < grains.count; i++) {
        grains.age[i] += dt;
        grains.vy[i] += gravity * dt;
        grains.x[i] += grains.vx[i] * dt;
        grains.y[i] += grains.vy[i] * dt;
        if (grains.age[i] >= grains.life[i] || grains.y[i] > grains.floor[i] + 1) continue;
        if (alive !== i) {
          grains.x[alive] = grains.x[i];
          grains.y[alive] = grains.y[i];
          grains.vx[alive] = grains.vx[i];
          grains.vy[alive] = grains.vy[i];
          grains.age[alive] = grains.age[i];
          grains.life[alive] = grains.life[i];
          grains.floor[alive] = grains.floor[i];
          grains.size[alive] = grains.size[i];
        }
        alive++;
      }
      grains.count = alive;
      for (let bucket = 0; bucket < sandStyles.length; bucket++) {
        context.fillStyle = sandStyles[bucket];
        context.beginPath();
        for (let i = 0; i < grains.count; i++) {
          const fade = 1 - grains.age[i] / grains.life[i];
          if (Math.min(sandStyles.length - 1, Math.floor(fade * sandStyles.length)) !== bucket) continue;
          context.rect(grains.x[i], grains.y[i], grains.size[i], grains.size[i]);
        }
        context.fill();
      }
    };

    const paint = (t: number, dt: number) => {
      context.clearRect(0, 0, width, height);
      if (compactQuery.matches) return;
      const summons = still ? null : getSummons();
      tracks.forEach((track, i) => {
        const pose = wormPose(track, still ? STILL[track.spec.id] : t, summons);
        if (!pose.active) return;
        const spine = spines[i];
        buildSpine(track, pose, spine);
        let visible = false;
        for (let k = 0; k <= SAMPLES && !visible; k++) visible = spine.h[k] > -1.1;
        if (!visible) return;
        const radius = track.spec.radius * cover.scale;
        context.save();
        clipToSand(spine, radius);
        drawBody(spine, tones[i], radius);
        if (spine.h[0] > -1.2) drawMouth(spine, tones[i], pose);
        drawBerms(spine, radius);
        context.restore();
        if (dt > 0) throwSand(track, spine, pose, dt);
      });
      if (dt > 0) drawGrains(dt);
    };

    const loop = (now: number) => {
      // Draw at most 30 times a second; the loop stops entirely when unseen.
      if (width && height && (!lastPaint || now - lastPaint >= 1000 / 30)) {
        const dt = lastPaint ? Math.min((now - lastPaint) / 1000, 0.05) : 1 / 30;
        lastPaint = now;
        paint(wormClock(), dt);
      }
      frame = window.requestAnimationFrame(loop);
    };

    const redraw = () => {
      resize();
      if (still) paint(0, 0);
    };

    redraw();
    const observer = new ResizeObserver(redraw);
    observer.observe(canvas);
    observer.observe(host);
    compactQuery.addEventListener("change", redraw);
    document.fonts?.ready.then(keepClearOfText).catch(() => {});
    if (running) frame = window.requestAnimationFrame(loop);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      compactQuery.removeEventListener("change", redraw);
      context.clearRect(0, 0, width, height);
    };
  }, [running, still, resolvedTheme]);

  return <canvas ref={ref} data-sandworms className={styles.wormCanvas} />;
}
