"use client";

import { useState } from "react";
import type { Project } from "@/lib/github";
import { ArrowUpRight, StarIcon } from "@/components/icons";

const monthYear = new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" });

export function ProjectGrid({ projects, languages }: { projects: Project[]; languages: string[] }) {
  const [filter, setFilter] = useState<string | null>(null);
  const shown = filter ? projects.filter((p) => p.language === filter) : projects;

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by language">
        {[null, ...languages].map((lang) => (
          <button
            key={lang ?? "all"}
            type="button"
            aria-pressed={filter === lang}
            onClick={() => setFilter(lang)}
            className={`rounded-full border px-3 py-1 font-mono text-xs transition ${
              filter === lang
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted hover:border-accent hover:text-foreground"
            }`}
          >
            {lang ?? "All"}
          </button>
        ))}
      </div>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => (
          <li key={p.name}>
            <a
              href={p.liveUrl ?? p.url}
              target="_blank"
              rel="noreferrer"
              className="flex h-full flex-col rounded-xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-accent/60"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="truncate font-medium">{p.title}</h3>
                {p.liveUrl && (
                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent">
                    Live <ArrowUpRight className="size-3" />
                  </span>
                )}
              </div>
              <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted">
                {p.description || "No description yet."}
              </p>
              <div className="mt-4 flex items-center gap-4 font-mono text-[11px] text-muted">
                {p.language && <span>{p.language}</span>}
                {p.stars > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <StarIcon className="size-3" /> {p.stars}
                  </span>
                )}
                <span className="ml-auto">{monthYear.format(new Date(p.pushedAt))}</span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
