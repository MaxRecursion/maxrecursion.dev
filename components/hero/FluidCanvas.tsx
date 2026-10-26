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
    requestAnimationFrame(() => setReady(true));

    return () => {
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
