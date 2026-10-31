import Image from "next/image";
import styles from "@/app/home.module.css";
import { SunCycle } from "./SunCycle";
import { CloudDrift } from "./CloudDrift";
import { DesertAtmosphere } from "./DesertAtmosphere";

/** A still terrain with a moving sky, clock-driven sun and a fine spice drift. */
export function HeroBackground() {
  return (
    <div aria-hidden="true" className={styles.landscape}>
      <DesertAtmosphere>
        <Image
          src="/images/desert-sky.webp"
          alt=""
          fill
          preload
          sizes="100vw"
          className={styles.desertImage}
        />
        <CloudDrift />
      </DesertAtmosphere>
      <SunCycle />
      <div className={styles.landscapeShade} />
      <div className={`grain ${styles.landscapeGrain}`} />
    </div>
  );
}
