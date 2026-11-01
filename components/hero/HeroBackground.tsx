import Image from "next/image";
import styles from "@/app/home.module.css";
import { SunCycle } from "./SunCycle";
import { CloudDrift } from "./CloudDrift";
import { DesertAtmosphere } from "./DesertAtmosphere";

/** Still terrain under a softened sky, a clock-driven sun, drifting clouds, sandworms and spice. */
export function HeroBackground() {
  return (
    <div aria-hidden="true" className={styles.landscape}>
      <DesertAtmosphere
        scene={
          <Image
            src="/images/desert-sky-clear.webp"
            alt=""
            fill
            preload
            sizes="100vw"
            className={styles.desertImage}
          />
        }
        sky={
          <>
            <SunCycle />
            <CloudDrift />
          </>
        }
      />
      <div className={styles.landscapeShade} />
      <div className={`grain ${styles.landscapeGrain}`} />
    </div>
  );
}
