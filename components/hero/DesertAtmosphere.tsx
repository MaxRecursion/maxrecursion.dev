"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import styles from "@/app/home.module.css";
import { Sandworms } from "./Sandworms";
import { SpiceDrift } from "./SpiceDrift";
import { useAnimationGate } from "./useAnimationGate";

/**
 * One visibility controller keeps every atmospheric layer idle when unseen.
 * The faded scene sits at the back, the sky (sun, clouds) above it, then the
 * sandworms and the spice blowing over everything.
 */
export function DesertAtmosphere({ scene, sky }: { scene: ReactNode; sky?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { running, still } = useAnimationGate(ref);

  return (
    <div
      ref={ref}
      data-desert-atmosphere
      data-running={running}
      className={styles.atmosphere}
      style={{ "--atmosphere-play-state": running ? "running" : "paused" } as CSSProperties}
    >
      <div className={styles.desertScene}>{scene}</div>
      {sky}
      <Sandworms running={running} still={still} />
      <SpiceDrift running={running} />
    </div>
  );
}
