import Image from "next/image";
import styles from "./CloudDrift.module.css";

/** An opaque sky layer fades into the still landscape before the dune horizon. */
export function CloudDrift() {
  return (
    <div aria-hidden="true" className={styles.sky} data-cloud-drift>
      <Image
        src="/images/desert-sky.webp"
        alt=""
        fill
        sizes="100vw"
        className={styles.clouds}
      />
    </div>
  );
}
