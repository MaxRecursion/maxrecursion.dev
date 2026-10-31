"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { getSpiceGust, type SpicePointer } from "@/lib/spice-wind";
import styles from "@/app/home.module.css";

type Grain = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  lane: number;
  phase: number;
  size: number;
  alpha: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const PARTICLE_MULTIPLIER = 3;
const MOTION_MULTIPLIER = 2;

/** Sparse 2D grains confined to the dunes; a local gust never captures the pointer. */
export function SpiceDrift({ running }: { running: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = ref.current;
    const hero = canvas?.closest("section");
    if (!canvas || !hero || !running) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    let width = 0;
    let height = 0;
    let grains: Grain[] = [];
    let frame = 0;
    let lastPaint = 0;
    let lastPointerTime = 0;
    const pointer: SpicePointer = { x: 0, y: 0, vx: 0, vy: 0, active: false };
    const ink = resolvedTheme === "dark" ? "218, 176, 111" : "139, 88, 38";

    const duneHeight = (grain: Grain) => height * (
      0.16 + grain.lane * 0.68 + Math.sin((grain.x / width) * Math.PI * 1.6 + grain.phase) * 0.035
    );

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      width = box.width;
      height = box.height;
      if (!width || !height) return;
      const compact = window.innerWidth < 768;
      const ratio = Math.min(window.devicePixelRatio || 1, compact ? 1 : 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      // Fixed seed gives a quiet, repeatable field without hydration-time randomness.
      let seed = 3917;
      const random = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };
      grains = Array.from({ length: (compact ? 48 : 110) * PARTICLE_MULTIPLIER }, () => {
        const speed = (7 + random() * 12) * MOTION_MULTIPLIER;
        const grain: Grain = {
          x: random() * width,
          y: 0,
          vx: speed,
          vy: 0,
          speed,
          lane: random(),
          phase: random() * Math.PI * 2,
          size: 0.45 + random() * 0.65,
          alpha: 0.16 + random() * 0.3,
        };
        grain.y = duneHeight(grain);
        return grain;
      });
      pointer.active = false;
      canvas.dataset.interacting = "false";
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

    const paint = (now: number) => {
      // Draw at most 30 times a second; the entire loop is stopped offscreen.
      if (width && height && (!lastPaint || now - lastPaint >= 1000 / 30)) {
        const dt = lastPaint ? Math.min((now - lastPaint) / 1000, 0.05) : 1 / 30;
        lastPaint = now;
        context.clearRect(0, 0, width, height);
        const settle = 1 - Math.exp(-dt * 1.6);
        pointer.vx *= Math.exp(-dt * 4);
        pointer.vy *= Math.exp(-dt * 4);

        for (const grain of grains) {
          const gust = getSpiceGust(grain.x, grain.y, pointer);
          grain.vx += (grain.speed - grain.vx) * settle + gust.x * dt * MOTION_MULTIPLIER;
          grain.vy += ((duneHeight(grain) - grain.y) * 0.8 - grain.vy) * settle + gust.y * dt * MOTION_MULTIPLIER;
          grain.vx = clamp(grain.vx, -30 * MOTION_MULTIPLIER, 65 * MOTION_MULTIPLIER);
          grain.vy = clamp(grain.vy, -45 * MOTION_MULTIPLIER, 45 * MOTION_MULTIPLIER);
          grain.x += grain.vx * dt;
          grain.y += grain.vy * dt;
          if (grain.x > width + 24) grain.x = -24;
          if (grain.x < -30) grain.x = width + 24;
          if (grain.y < -24 || grain.y > height + 24) grain.y = duneHeight(grain);

          const fade = clamp(Math.min(grain.x / 40, (width - grain.x) / 40, grain.y / 18, (height - grain.y) / 18), 0, 1);
          const alpha = grain.alpha * fade;
          if (alpha <= 0) continue;
          context.strokeStyle = `rgba(${ink}, ${alpha * 0.35})`;
          context.lineWidth = grain.size * 0.6;
          context.beginPath();
          context.moveTo(grain.x - grain.vx * 0.12, grain.y - grain.vy * 0.12);
          context.lineTo(grain.x, grain.y);
          context.stroke();
          context.fillStyle = `rgba(${ink}, ${alpha})`;
          context.beginPath();
          context.ellipse(grain.x, grain.y, grain.size * 1.4, grain.size * 0.55, Math.atan2(grain.vy, grain.vx), 0, Math.PI * 2);
          context.fill();
        }
      }
      frame = window.requestAnimationFrame(paint);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    hero.addEventListener("pointermove", move, { passive: true });
    hero.addEventListener("pointerleave", leave);
    hero.addEventListener("pointercancel", leave);
    window.addEventListener("scroll", leave, { passive: true });
    window.addEventListener("blur", leave);
    frame = window.requestAnimationFrame(paint);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerleave", leave);
      hero.removeEventListener("pointercancel", leave);
      window.removeEventListener("scroll", leave);
      window.removeEventListener("blur", leave);
      leave();
      context.clearRect(0, 0, width, height);
    };
  }, [running, resolvedTheme]);

  return <canvas ref={ref} data-spice-drift data-interacting="false" className={styles.spiceCanvas} />;
}
