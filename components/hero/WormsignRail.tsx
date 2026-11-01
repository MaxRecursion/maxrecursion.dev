"use client";

import { useEffect, useRef, useSyncExternalStore, type CSSProperties, type RefObject } from "react";
import { useTheme } from "next-themes";
import { summonedDuration, wormsignAt } from "@/lib/sandworms";
import {
  createStrip, growStrip, nextPhaseChange, PAPER_SPEED, penDeflection, recordStrip, thumperPhase, walkStrip,
  type ThumperPhase, type TraceStrip,
} from "@/lib/wormsign-trace";
import styles from "./WormsignRail.module.css";
import { getSummons, plantThumper, subscribeSummons } from "./thumper";
import { useAnimationGate } from "./useAnimationGate";
import { getWormTracks, wormClock } from "./wormTracks";

/** CSS px the pen swings either side of the baseline at full scale. */
const AMPLITUDE = 16;
const TRACE_ALPHA = 0.75;
/** Hairline ticks ride on the paper either side of the pen: one every 32 px, a long one every fourth. */
const TICK_SPACING = 32;
const TICK_GAP = 19;
const TICK_SHORT = 4;
const TICK_LONG = 8;
/** Reduced motion: the paper as it stood at this clock time, a calm stretch. */
const STILL_TIME = 80;

const LABELS: Record<ThumperPhase, string> = {
  ready: "plant a thumper",
  beating: "thump · thump",
  answering: "shai-hulud",
};

const readPhase = () => thumperPhase(wormClock(), getSummons(), summonedDuration);

/** The phase changes when a thumper is planted, then only at the times its summons names. */
function subscribePhase(onChange: () => void) {
  let timer = 0;
  const schedule = () => {
    const now = wormClock();
    const next = nextPhaseChange(now, getSummons(), summonedDuration);
    window.clearTimeout(timer);
    if (next === null) return;
    // A few ms late, so the next phase has begun when the label reads it.
    timer = window.setTimeout(() => {
      schedule();
      onChange();
    }, (next - now) * 1000 + 5);
  };
  const unsubscribe = subscribeSummons(() => {
    schedule();
    onChange();
  });
  schedule();
  return () => {
    unsubscribe();
    window.clearTimeout(timer);
  };
}

/**
 * A seismograph in the empty margin left of the hero text. Paper runs down
 * from a pen that feels the sandworms crossing the dunes, and a thumper calls
 * Shai-Hulud, who answers out on the dunes a few seconds later.
 */
export function WormsignRail() {
  const ref = useRef<HTMLDivElement>(null);
  const paper = useRef<HTMLCanvasElement>(null);
  /** What the pen has written, kept while the rail rests: the clock reads back only the latest thumper. */
  const roll = useRef<TraceStrip | null>(null);
  const { running, still } = useAnimationGate(ref);
  const { resolvedTheme } = useTheme();
  const phase = useSyncExternalStore(subscribePhase, readPhase, (): ThumperPhase => "ready");

  useEffect(() => {
    const canvas = paper.current;
    if (!canvas || (!running && !still)) return;
    return recordWormsign(canvas, running ? roll : null);
  }, [running, still, resolvedTheme]);

  return (
    <div
      ref={ref}
      data-wormsign
      className={`hero-rise ${styles.rail}`}
      style={{ "--rise-delay": "560ms" } as CSSProperties}
    >
      <p aria-hidden="true" className={styles.label}>
        <span className={styles.marker} />
        wormsign
      </p>
      <canvas ref={paper} aria-hidden="true" className={styles.paper} />
      {/* Stays focusable while Shai-Hulud answers; plantThumper ignores clicks until then. */}
      <button
        type="button"
        aria-label="Plant a thumper to call the sandworm"
        aria-disabled={phase !== "ready"}
        data-phase={phase}
        className={styles.thumper}
        onClick={() => plantThumper()}
      >
        {LABELS[phase]}
      </button>
      <p role="status" aria-live="polite" className="sr-only">
        {phase === "answering" ? "Shai-Hulud answers." : ""}
      </p>
    </div>
  );
}

/**
 * Draws the wormsign on `canvas` until the returned cleanup runs: live onto
 * the strip `roll` keeps between runs, or without one a still sheet of calm paper.
 */
function recordWormsign(canvas: HTMLCanvasElement, roll: RefObject<TraceStrip | null> | null) {
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;
  const live = roll !== null;
  const tracks = getWormTracks();
  const read = live
    ? (t: number) => wormsignAt(tracks, t, getSummons()).value
    : (t: number) => wormsignAt(tracks, t).value;

  let strip = roll?.current ?? null;
  let width = 0;
  let height = 0;
  let ratio = 1;
  let centre = 0;
  let ink = "";
  let rule = "";
  let frame = 0;
  let lastPaint = 0;
  /** Device px the paper had travelled at the last paint. */
  let travel = Number.NaN;
  // The pen's path through one paint.
  let offset = 0;
  let inked = false;
  let penX = 0;
  let penY = 0;

  /** Curves through the midpoints between samples, as an ink pen would draw. */
  const plot = (time: number, value: number) => {
    const x = centre + penDeflection(value, AMPLITUDE);
    const y = offset - time * PAPER_SPEED;
    if (inked) context.quadraticCurveTo(penX, penY, (penX + x) / 2, (penY + y) / 2);
    else context.moveTo(x, y);
    inked = true;
    penX = x;
    penY = y;
  };

  const paint = (now: number) => {
    if (!strip) return;
    recordStrip(strip, now, read);
    // Snapped to device pixels, so the baseline and ticks stay crisp as the paper runs.
    travel = Math.round(now * PAPER_SPEED * ratio);
    offset = travel / ratio;
    context.clearRect(0, 0, width, height);
    context.fillStyle = rule;
    context.fillRect(centre - 0.5, 0, 1, height);
    for (let tick = Math.ceil((offset - height) / TICK_SPACING); tick * TICK_SPACING <= offset; tick++) {
      const y = offset - tick * TICK_SPACING;
      const length = tick % 4 === 0 ? TICK_LONG : TICK_SHORT;
      context.fillRect(centre - 0.5 - TICK_GAP - length, y, length, 1);
      context.fillRect(centre + 0.5 + TICK_GAP, y, length, 1);
    }
    context.globalAlpha = TRACE_ALPHA;
    context.strokeStyle = ink;
    context.beginPath();
    inked = false;
    walkStrip(strip, plot);
    context.stroke();
    context.globalAlpha = 1;
  };

  const resize = () => {
    // Layout sizes, so the entrance transform never skews the bitmap.
    width = canvas.offsetWidth;
    height = canvas.offsetHeight;
    if (!width || !height) return;
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.lineWidth = 1;
    context.lineJoin = "round";
    centre = Math.floor(width / 2) + 0.5;
    // Colours are read here, after next-themes has switched the class on <html>, not in the effect.
    const style = getComputedStyle(canvas);
    ink = style.color;
    rule = style.borderTopColor;
    // Taller paper keeps what the pen has written and reads the older paper below it from the clock.
    strip = strip ? growStrip(strip, height, read) : createStrip(height);
    if (roll) roll.current = strip;
    paint(live ? wormClock() : STILL_TIME);
  };

  const loop = (time: number) => {
    // At most 30 paints a second, and only once the paper has moved a device pixel.
    if (!lastPaint || time - lastPaint >= 1000 / 30 - 2) {
      const now = wormClock();
      if (Math.round(now * PAPER_SPEED * ratio) !== travel) {
        lastPaint = time;
        paint(now);
      }
    }
    frame = window.requestAnimationFrame(loop);
  };

  // A move to a screen of another pixel density changes no CSS size, so the observer below never sees it.
  let density = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
  const rescale = () => {
    density.removeEventListener("change", rescale);
    density = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    density.addEventListener("change", rescale);
    resize();
  };
  density.addEventListener("change", rescale);

  // The first observation sizes the canvas and paints, after this commit's effects have run.
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  if (live) frame = window.requestAnimationFrame(loop);
  return () => {
    window.cancelAnimationFrame(frame);
    observer.disconnect();
    density.removeEventListener("change", rescale);
  };
}
