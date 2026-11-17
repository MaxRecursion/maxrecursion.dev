import type { Metadata } from "next";
import Link from "next/link";
import { Footer, Header } from "@/components/sections";
import { ThingsGallery } from "@/components/things/ThingsGallery";
import { pageMetadata } from "@/lib/seo";
import homeStyles from "../home.module.css";
import styles from "./things.module.css";

export const metadata: Metadata = {
  ...pageMetadata({
    path: "/things",
    title: "Things",
    description: "A personal collection of everyday tech, keyboards, desk essentials, and model cars.",
    image: "/opengraph-image",
    imageAlt: "Akshay Kulkarni — MaxRecursion",
  }),
  robots: { index: false, follow: false },
};

export default function ThingsPage() {
  return (
    <div className={homeStyles.home}>
      <Header />
      <main id="main" className={styles.main}>
        <div className={styles.breadcrumb}>
          <Link href="/" className={styles.backLink}><span aria-hidden="true">←</span> Back home</Link>
          <span className={styles.pageLabel}>A personal inventory</span>
        </div>

        <div className={styles.intro}>
          <div>
            <p className={styles.eyebrow}><span aria-hidden="true" /> The everyday & the just-because</p>
            <h1 className={styles.title}>Things<span>.</span></h1>
          </div>
          <p className={styles.description}>
            Tools I use, keyboards I rotate through, and a few things that simply make my desk feel like mine.
          </p>
        </div>

        <ThingsGallery />

        <div className={styles.endNote}>
          <p>A work in progress. Just like the desk.</p>
          <p>
            Inspired by <a href="https://www.ashwinexe.com/things" target="_blank" rel="noreferrer noopener">Ashwin’s things<span className="sr-only"> (opens in a new tab)</span> <span aria-hidden="true">↗</span></a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
