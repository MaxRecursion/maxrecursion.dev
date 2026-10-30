import Image from "next/image";
import styles from "@/app/home.module.css";

/** A still landscape: no canvas, animation loop, or pointer tracking. */
export function HeroBackground() {
  return (
    <div aria-hidden="true" className={styles.landscape}>
      <Image
        src="/images/desert-eclipse.webp"
        alt=""
        fill
        preload
        sizes="100vw"
        className={styles.desertImage}
      />
      <div className={styles.landscapeShade} />
      <div className={`grain ${styles.landscapeGrain}`} />
    </div>
  );
}
