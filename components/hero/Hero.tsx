import type { CSSProperties } from "react";
import { site } from "@/content/site";
import { trackClick } from "@/lib/analytics";
import { ArrowDownIcon, GitHubIcon, LinkedInIcon } from "@/components/icons";
import { HeroBackground } from "./HeroBackground";
import { LocalTime } from "./LocalTime";
import { MagneticLink } from "./MagneticLink";

// Entrance choreography, in ms after load: eyebrow, then the headline line by line, then the
// supporting rows. Everything has landed by about 1.6s. See .hero-rise in globals.css.
const LINE_START = 160;
const LINE_STEP = 110;
const rise = (ms: number) => ({ "--rise-delay": `${ms}ms` }) as CSSProperties;

const afterHeadline = LINE_START + site.hero.headline.length * LINE_STEP;

const profileLink =
  "grid size-11 place-items-center rounded-full text-muted transition-[color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:text-foreground active:scale-[0.98]";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[100svh] touch-pan-y items-center overflow-hidden py-24"
    >
      <HeroBackground />
      <div className="pointer-events-none relative z-10 mx-auto w-full max-w-5xl px-6">
        <p className="hero-rise font-mono text-sm text-muted" style={rise(0)}>
          <span className="text-accent">~/</span>
          {site.handle.toLowerCase()}.dev
        </p>
        <h1
          id="hero-title"
          className="mt-4 max-w-[680px] text-4xl font-semibold tracking-tight min-[480px]:text-5xl sm:text-6xl lg:text-7xl"
        >
          {/* The name leads the heading for search engines and screen readers; visually the headline is unchanged. */}
          <span className="sr-only">{site.name}: </span>
          {/* The gradient is clipped to each line's own text: WebKit paints nothing when the clipped
              element only holds animated children, so the lines are what rise, not the words. */}
          {site.hero.headline.map((line, i) => (
            <span key={line} className="hero-rise hero-heading block" style={rise(LINE_START + i * LINE_STEP)}>
              {line}
            </span>
          ))}
        </h1>
        <p
          className="hero-rise mt-6 max-w-[680px] text-base text-pretty text-muted sm:text-lg"
          style={rise(afterHeadline - 120)}
        >
          {site.hero.intro}
        </p>
        <div
          className="hero-rise pointer-events-auto mt-10 flex flex-wrap items-center gap-6"
          style={rise(afterHeadline + 40)}
        >
          <MagneticLink
            href="#projects"
            className="group inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-3 py-2 text-base font-semibold text-background transition-[translate,scale,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:opacity-90 active:scale-[0.98]"
          >
            <span className="pl-2">See the projects</span>
            <span className="grid size-7 place-items-center rounded-full bg-background/15">
              <ArrowDownIcon className="size-4 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0.5" />
            </span>
          </MagneticLink>
          <div className="flex items-center gap-3 text-sm text-muted">
            <p>{site.hero.proof}</p>
            <span aria-hidden="true" className="h-4 w-px bg-border" />
            <div className="-mx-2 flex items-center">
              <a
                href={site.links.github}
                target="_blank"
                rel="noreferrer noopener"
                className={profileLink}
                {...trackClick({ name: "social_click", params: { platform: "github" } })}
              >
                <GitHubIcon className="size-5" />
                <span className="sr-only">GitHub (opens in a new tab)</span>
              </a>
              <a
                href={site.links.linkedin}
                target="_blank"
                rel="noreferrer noopener"
                className={profileLink}
                {...trackClick({ name: "social_click", params: { platform: "linkedin" } })}
              >
                <LinkedInIcon className="size-5" />
                <span className="sr-only">LinkedIn (opens in a new tab)</span>
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="hero-rise pointer-events-none absolute inset-x-0 bottom-6" style={rise(afterHeadline + 200)}>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 font-mono text-xs text-muted">
          <p className="flex items-center gap-2 whitespace-nowrap">
            <span aria-hidden="true" className="size-2 rounded-full bg-accent-2" />
            <span>
              {site.location.replace(", India", "")} · <LocalTime />
            </span>
          </p>
          <p className="whitespace-nowrap text-right">
            <span className="pointer-coarse:hidden">Real fluid sim. Move your cursor.</span>
            <span className="pointer-fine:hidden">Touch and drag</span>
          </p>
        </div>
      </div>
    </section>
  );
}
