"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { FluidSimulation } from "./fluid/simulation";

const IDLE_AFTER_MS = 2500;

export default function FluidCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<FluidSimulation | null>(null);
  const [ready, setReady] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const small = window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;
    const sim = FluidSimulation.create(canvas, {
      dyeResolution: small ? 512 : 1024,
      pressureIterations: small ? 14 : 20,
    });
    if (!sim) return;
    simRef.current = sim;

    let lastInput = 0;
    let prev: { x: number; y: number } | null = null;
    // The cursor's dye colour drifts slowly so each stroke keeps a distinct hue.
    let color = sim.nextColor();
    const recolor = window.setInterval(() => (color = sim.nextColor()), 700);

    const toUv = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: (e.clientX - rect.left) / rect.width, y: 1 - (e.clientY - rect.top) / rect.height };
    };

    const onMove = (e: PointerEvent) => {
      const p = toUv(e);
      if (prev) {
        const dx = p.x - prev.x;
        const dy = p.y - prev.y;
        if (dx !== 0 || dy !== 0) sim.splat(p.x, p.y, dx, dy, color);
      }
      prev = p;
      lastInput = performance.now();
    };

    const onDown = (e: PointerEvent) => {
      const p = toUv(e);
      prev = p;
      lastInput = performance.now();
      sim.splat(p.x, p.y, (Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01, sim.nextColor(4));
    };

    const onLeave = () => {
      prev = null;
    };

    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerdown", onDown, { passive: true });
    host.addEventListener("pointerleave", onLeave, { passive: true });

    // Gentle ambient motion when nobody is touching it.
    const idle = window.setInterval(() => {
      if (sim.isRunning && performance.now() - lastInput > IDLE_AFTER_MS) sim.randomSplats(1);
    }, 1400);

    let visible = true;
    const sync = () => (visible && !document.hidden ? sim.start() : sim.stop());
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(canvas);
    document.addEventListener("visibilitychange", sync);

    sim.randomSplats(6);
    sim.start();

    // Opening flourish while the headline lands, so the page announces that the background is
    // alive. Wide screens get an S shaped stroke rising across the right of the hero; on a
    // portrait screen the text fills the width, so a flatter stroke runs along the bottom instead.
    const STROKE_STEPS = 18;
    const portrait = host.clientHeight > host.clientWidth;
    let stroke = 0;
    let sweep = 0;
    const sweepStart = window.setTimeout(() => {
      sweep = window.setInterval(() => {
        const u = stroke / (STROKE_STEPS - 1);
        const wave = Math.sin(u * Math.PI * 2);
        const x = portrait ? 0.05 + 0.9 * u : 0.4 + 0.5 * u;
        const y = portrait ? 0.11 + 0.04 * wave : 0.22 + 0.5 * u + 0.1 * wave;
        const rise = portrait ? 0.04 * 2 * Math.PI * Math.cos(u * Math.PI * 2) : 0.5 + 0.2 * Math.PI * Math.cos(u * Math.PI * 2);
        const heading = Math.atan2(rise, portrait ? 0.9 : 0.5);
        sim.splat(x, y, Math.cos(heading) * 0.012, Math.sin(heading) * 0.012, sim.nextColor(portrait ? 1.6 : 2.4));
        if (++stroke >= STROKE_STEPS) window.clearInterval(sweep);
      }, 55);
    }, 350);
    const reveal = requestAnimationFrame(() => setReady(true));

    return () => {
      cancelAnimationFrame(reveal);
      window.clearTimeout(sweepStart);
      window.clearInterval(sweep);
      window.clearInterval(idle);
      window.clearInterval(recolor);
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointerleave", onLeave);
      sim.destroy();
      simRef.current = null;
    };
  }, []);

  useEffect(() => {
    simRef.current?.setIntensity(resolvedTheme === "light" ? 1.25 : 1);
  }, [resolvedTheme, ready]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 h-full w-full transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}
    />
  );
}
