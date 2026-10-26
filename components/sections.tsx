import Link from "next/link";
import type { ReactNode } from "react";
import { site } from "@/content/site";
import { GitHubIcon, LinkedInIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme";

const navLink =
  "rounded-full px-2 py-3 text-muted transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-foreground sm:px-3";

// A compact translucent pill that floats off the top edge, sized to its content.
export function Header() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div
        className="hero-rise pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-background/60 py-1 pl-3 pr-1 backdrop-blur-xl sm:pl-4"
        style={{ "--rise-delay": "0ms" } as React.CSSProperties}
      >
        <Link href="/" className="rounded-full py-3 pr-2 font-mono text-sm font-medium" aria-label="f(MaxRecursion), home">
          <span className="text-accent">{"f("}</span>
          {site.handle}
          <span className="text-accent">{")"}</span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1 text-sm">
          <Link href="/#projects" className={navLink}>
            Projects
          </Link>
          <Link href="/#case-studies" className={navLink}>
            <span className="hidden sm:inline">Case studies</span>
            <span className="sm:hidden">Studies</span>
          </Link>
          {/* Dropped on the narrowest phones so the theme toggle is never pushed off-screen. */}
          <Link href="/#about" className={`${navLink} hidden min-[400px]:block`}>
            About
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

export function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mx-auto max-w-5xl scroll-mt-20 px-6 py-16 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
      <h2 id={`${id}-title`} className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
      <div className="mt-10">{children}</div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          {site.name} · {site.location}
        </p>
        <div className="flex items-center gap-5">
          <span className="font-mono text-xs">Next.js · Vercel · WebGL</span>
          <a
            href={site.links.github}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="GitHub (opens in a new tab)"
            className="grid size-11 place-items-center rounded-full hover:text-foreground"
          >
            <GitHubIcon className="size-5" />
          </a>
          <a
            href={site.links.linkedin}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="LinkedIn (opens in a new tab)"
            className="grid size-11 place-items-center rounded-full hover:text-foreground"
          >
            <LinkedInIcon className="size-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
