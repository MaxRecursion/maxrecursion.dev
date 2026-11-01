import Image from "next/image";
import styles from "./CloudDrift.module.css";

/**
 * The sky's cloud detail drifting with the wind over the softened sky of
 * `desert-sky-clear.webp`. Two copies cross-fade on a conveyor, so the drift
 * never jumps back; at rest the first lies exactly over the artwork.
 * See `scripts/derive-desert-clouds.mjs`.
 */
export function CloudDrift() {
  return (
    <div aria-hidden="true" className={styles.sky} data-cloud-drift>
      <Image src="/images/desert-clouds.webp" alt="" fill loading="eager" sizes="100vw" className={styles.clouds} />
      <Image
        src="/images/desert-clouds.webp"
        alt=""
        fill
        loading="eager"
        sizes="100vw"
        className={`${styles.clouds} ${styles.trailing}`}
      />
    </div>
  );
}
