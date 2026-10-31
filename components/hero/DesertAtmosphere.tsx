"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import styles from "@/app/home.module.css";
import { SpiceDrift } from "./SpiceDrift";

/** One visibility controller keeps both atmospheric layers idle when unseen. */
export function DesertAtmosphere({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const update = () => setRunning(visible && !document.hidden && !motion.matches);
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        update();
      },
      { threshold: 0 },
    );

    if (observer) observer.observe(element);
    else {
      visible = true;
      update();
    }
    document.addEventListener("visibilitychange", update);
    motion.addEventListener("change", update);
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", update);
      motion.removeEventListener("change", update);
    };
  }, []);

  return (
    <div
      ref={ref}
      data-desert-atmosphere
      data-running={running}
      className={styles.atmosphere}
      style={{ "--atmosphere-play-state": running ? "running" : "paused" } as CSSProperties}
    >
      <div className={styles.desertScene}>{children}</div>
      <SpiceDrift running={running} />
    </div>
  );
}
