import type { ReactNode } from "react";
import { site } from "@/content/site";
import { GitHubIcon, LinkedInIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme";

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <a href="#top" className="font-mono text-sm font-medium" aria-label={`${site.name}, back to top`}>
          <span className="text-accent">{"f("}</span>
          {site.handle}
          <span className="text-accent">{")"}</span>
        </a>
        <nav className="flex items-center gap-1 text-sm">
          <a href="#projects" className="hidden rounded-full px-3 py-1.5 text-muted hover:text-foreground sm:block">
            Projects
          </a>
          <a href="#about" className="hidden rounded-full px-3 py-1.5 text-muted hover:text-foreground sm:block">
            About
          </a>
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
    <section id={id} className="mx-auto max-w-5xl scroll-mt-20 px-6 py-20 sm:py-28">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
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
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs">Next.js · Vercel · WebGL</span>
          <a href={site.links.github} target="_blank" rel="noreferrer" aria-label="GitHub" className="hover:text-foreground">
            <GitHubIcon className="size-4" />
          </a>
          <a href={site.links.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="hover:text-foreground">
            <LinkedInIcon className="size-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
