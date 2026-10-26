import Link from "next/link";
import type { CSSProperties } from "react";
import { site } from "@/content/site";
import { ArrowDownIcon, GitHubIcon, LinkedInIcon } from "@/components/icons";
import { HeroBackground } from "./HeroBackground";

// Staggers the entrance of each hero row; see .hero-rise in globals.css.
const rise = (step: number) => ({ "--rise-delay": `${step * 80}ms` }) as CSSProperties;

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
          className="hero-rise hero-heading mt-4 max-w-[680px] text-4xl font-semibold tracking-tight text-balance sm:text-5xl"
          style={rise(1)}
        >
          {/* Each line is its own block so text-balance evens out the wrap within it on phones. */}
          {site.hero.headline.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h1>
        <p
          className="hero-rise mt-6 max-w-[680px] text-base text-pretty text-muted sm:text-lg"
          style={rise(2)}
        >
          {site.hero.intro}
        </p>
        <div className="hero-rise pointer-events-auto mt-10 flex flex-wrap items-center gap-6" style={rise(3)}>
          <Link
            href="#projects"
            className="group inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-3 py-2 text-base font-semibold text-background transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:opacity-90 active:scale-[0.98]"
          >
            <span className="pl-2">See the projects</span>
            <span className="grid size-7 place-items-center rounded-full bg-background/15">
              <ArrowDownIcon className="size-4 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0.5" />
            </span>
          </Link>
          <div className="flex items-center gap-3 text-sm text-muted">
            <p>{site.hero.proof}</p>
            <span aria-hidden="true" className="h-4 w-px bg-border" />
            <div className="-mx-2 flex items-center">
              <a href={site.links.github} target="_blank" rel="noreferrer noopener" className={profileLink}>
                <GitHubIcon className="size-5" />
                <span className="sr-only">GitHub (opens in a new tab)</span>
              </a>
              <a href={site.links.linkedin} target="_blank" rel="noreferrer noopener" className={profileLink}>
                <LinkedInIcon className="size-5" />
                <span className="sr-only">LinkedIn (opens in a new tab)</span>
              </a>
            </div>
          </div>
        </div>
      </div>
      <p
        className="hero-rise pointer-events-none absolute inset-x-6 bottom-6 text-center font-mono text-xs text-muted"
        style={rise(5)}
      >
        {site.tagline.toLowerCase()}
        <span className="hidden sm:inline"> · move your cursor, it&apos;s a real fluid sim</span>
      </p>
    </section>
  );
}
