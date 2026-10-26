import { site } from "@/content/site";
import { GitHubIcon, LinkedInIcon } from "@/components/icons";
import { HeroBackground } from "./HeroBackground";

export function Hero() {
  return (
    <section className="relative isolate flex h-[100svh] min-h-[560px] touch-pan-y items-center overflow-hidden">
      <HeroBackground />
      <div className="pointer-events-none relative z-10 mx-auto w-full max-w-5xl px-6">
        <p className="font-mono text-sm tracking-wider text-muted">
          <span className="text-accent">~/</span>
          {site.handle.toLowerCase()}.dev
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-7xl">{site.name}</h1>
        <p className="mt-5 max-w-xl text-lg text-muted sm:text-xl">
          {site.role}. {site.tagline}
        </p>
        <div className="pointer-events-auto mt-10 flex flex-wrap items-center gap-3">
          <a
            href="#projects"
            className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-85"
          >
            See projects ↓
          </a>
          <a
            href={site.links.github}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-5 py-2.5 text-sm font-medium backdrop-blur transition hover:border-accent"
          >
            <GitHubIcon className="size-4" /> GitHub
          </a>
          <a
            href={site.links.linkedin}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-5 py-2.5 text-sm font-medium backdrop-blur transition hover:border-accent"
          >
            <LinkedInIcon className="size-4" /> LinkedIn
          </a>
        </div>
      </div>
      <p className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 font-mono text-xs text-muted sm:block">
        move your cursor · it&apos;s a real fluid sim
      </p>
    </section>
  );
}
