import type { CSSProperties } from "react";
import { site } from "@/content/site";
import { trackClick } from "@/lib/analytics";
import { ArrowDownIcon, GitHubIcon, LinkedInIcon } from "@/components/icons";
import styles from "@/app/home.module.css";
import { HeroBackground } from "./HeroBackground";
import { LocalTime } from "./LocalTime";

// One short entrance, then everything rests. The landscape is always still.
const rise = (ms: number) => ({ "--rise-delay": `${ms}ms` }) as CSSProperties;

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className={styles.hero}>
      <HeroBackground />
      <div className={styles.heroContent}>
        <p className={`hero-rise ${styles.eyebrow}`} style={rise(0)}>
          <span aria-hidden="true" className={styles.marker} />
          <span><span className="text-accent">~/</span>{site.handle.toLowerCase()}.dev</span>
        </p>
        <h1 id="hero-title" aria-label={`${site.name}: ${site.hero.headline.join(" ")}`} className={styles.headline}>
          <span className="sr-only">{site.name}: </span>
          {site.hero.headline.map((line, i) => (
            <span key={line} className={`hero-rise ${i > 1 ? styles.secondaryLine : ""}`} style={rise(80 + i * 75)}>
              {line}
            </span>
          ))}
        </h1>
        <p className={`hero-rise ${styles.intro}`} style={rise(330)}>{site.hero.intro}</p>
        <div className={`hero-rise ${styles.heroActions}`} style={rise(420)}>
          <a href="#projects" className={styles.projectLink}>
            See the projects
            <ArrowDownIcon className="size-4" />
          </a>
          <div className={styles.socialLinks}>
            <a
              href={site.links.github}
              target="_blank"
              rel="noreferrer noopener"
              className={styles.profileLink}
              {...trackClick({ name: "social_click", params: { platform: "github" } })}
            >
              <GitHubIcon className="size-4" />
              <span className="sr-only">GitHub (opens in a new tab)</span>
            </a>
            <a
              href={site.links.linkedin}
              target="_blank"
              rel="noreferrer noopener"
              className={styles.profileLink}
              {...trackClick({ name: "social_click", params: { platform: "linkedin" } })}
            >
              <LinkedInIcon className="size-4" />
              <span className="sr-only">LinkedIn (opens in a new tab)</span>
            </a>
          </div>
        </div>
      </div>
      <div className={`hero-rise ${styles.heroFoot}`} style={rise(500)}>
        <p className={styles.location}>
          <span aria-hidden="true" className={styles.statusDot} />
          {site.location.replace(", India", "")} <span aria-hidden="true">/</span> <LocalTime />
        </p>
        <p className={styles.proof}>{site.hero.proof}</p>
        <a href="#projects" className={styles.scrollLink}>
          <span>Scroll to explore</span><ArrowDownIcon className="size-3" />
        </a>
      </div>
    </section>
  );
}
