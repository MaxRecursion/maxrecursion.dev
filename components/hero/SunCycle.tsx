"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { getSolarCycle, type SolarCycle } from "@/lib/solar-cycle";
import styles from "@/app/home.module.css";

/** A decorative sun using the same Pune wall clock as the hero footer. */
export function SunCycle() {
  const [cycle, setCycle] = useState<SolarCycle | null>(null);
  const [placement, setPlacement] = useState(0);

  useEffect(() => {
    const update = () => setCycle(getSolarCycle(new Date()));
    const resync = () => {
      update();
      // After a long sleep, mount at the current position instead of gliding
      // for a minute from a stale morning/evening position.
      setPlacement((value) => value + 1);
    };
    const onVisibility = () => {
      if (!document.hidden) resync();
    };

    update();
    const interval = window.setInterval(update, 60_000);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", resync);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", resync);
    };
  }, []);

  // Mount at the correct position rather than travelling from a server-time
  // placeholder. Subsequent minute updates glide along the daily arc with CSS.
  const position = cycle ? ({
    "--portfolio-sun-x": cycle.x,
    "--portfolio-sun-y": cycle.y,
    "--sun-hue": 46 - 17 * cycle.warmth,
    "--sun-strength": 0.42 + 0.58 * cycle.brightness,
    "--sun-glow": 0.22 + 0.78 * cycle.glow,
  } as CSSProperties) : undefined;

  return (
    <div className={styles.skyCycle} data-solar-phase={cycle?.phase}>
      {cycle && (
        <div key={placement} className={styles.solarPosition} style={position}>
          <div className={styles.solarHalo} />
          <div className={styles.solarDisc}>
            <div className={styles.solarOcclusion} />
          </div>
        </div>
      )}
    </div>
  );
}
