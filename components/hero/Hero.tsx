import Link from "next/link";
import { site } from "@/content/site";
import { GitHubIcon, LinkedInIcon } from "@/components/icons";
import { HeroBackground } from "./HeroBackground";

const secondary =
  "inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-background/60 px-5 py-2.5 text-sm font-medium backdrop-blur transition hover:border-accent";

export function Hero() {
  const [role, focus] = site.headline.split(" | ");
  return (
    <section className="relative isolate flex min-h-[100svh] touch-pan-y items-center overflow-hidden py-28">
      <HeroBackground />
      <div className="pointer-events-none relative z-10 mx-auto w-full max-w-5xl px-6">
        <p className="font-mono text-sm tracking-wider text-muted">
          <span className="text-accent">~/</span>
          {site.handle.toLowerCase()}.dev
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-7xl">{site.name}</h1>
        <p className="mt-5 text-xl font-medium sm:text-2xl">
          <span>{role}</span>
          <span aria-hidden="true" className="mx-2 text-accent sm:mx-3">
            |
          </span>
          <span className="sr-only"> – </span>
          <span className="text-muted">{focus}</span>
        </p>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{site.summary}</p>
        <div className="pointer-events-auto mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="#projects"
            className="inline-flex min-h-11 items-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-85"
          >
            See projects ↓
          </Link>
          <Link href="#case-studies" className={secondary}>
            Case studies
          </Link>
          <a href={site.links.github} target="_blank" rel="noreferrer noopener" className={secondary}>
            <GitHubIcon className="size-4" /> GitHub
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <a href={site.links.linkedin} target="_blank" rel="noreferrer noopener" className={secondary}>
            <LinkedInIcon className="size-4" /> LinkedIn
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </div>
      <p className="pointer-events-none absolute inset-x-6 bottom-6 text-center font-mono text-xs text-muted">
        {site.tagline.toLowerCase()}
        <span className="hidden sm:inline"> · move your cursor, it&apos;s a real fluid sim</span>
      </p>
    </section>
  );
}
