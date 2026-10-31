import Image from "next/image";
import styles from "@/app/home.module.css";
import { SunCycle } from "./SunCycle";

/** The dunes stay still; only the clock-driven sun moves. */
export function HeroBackground() {
  return (
    <div aria-hidden="true" className={styles.landscape}>
      <Image
        src="/images/desert-sky.webp"
        alt=""
        fill
        preload
        sizes="100vw"
        className={styles.desertImage}
      />
      <SunCycle />
      <div className={styles.landscapeShade} />
      <div className={`grain ${styles.landscapeGrain}`} />
    </div>
  );
}
