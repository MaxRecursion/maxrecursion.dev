import { trackClick } from "@/lib/analytics";
import type { Project } from "@/lib/github";
import { ArrowUpRight, StarIcon } from "@/components/icons";

const monthYear = new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" });

export function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <li key={p.name}>
          <a
            href={p.liveUrl ?? p.url}
            target="_blank"
            rel="noreferrer noopener"
            className="flex h-full flex-col rounded-xl border border-border bg-surface p-5 transition hover:border-accent/60"
            {...trackClick({
              name: "project_click",
              params: { project_name: p.name, destination: p.liveUrl ? "live_demo" : "github" },
            })}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="truncate font-medium">{p.title}</h3>
              {p.liveUrl && (
                <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent">
                  Live <ArrowUpRight className="size-3" />
                </span>
              )}
            </div>
            {p.description && <p className="mt-2 line-clamp-3 text-sm text-muted">{p.description}</p>}
            <div className="mt-auto flex items-center gap-4 pt-4 font-mono text-[11px] text-muted">
              {p.language && <span>{p.language}</span>}
              {p.stars > 0 && (
                <span className="inline-flex items-center gap-1">
                  <StarIcon className="size-3" /> {p.stars}
                  <span className="sr-only"> stars</span>
                </span>
              )}
              {p.pushedAt && <span className="ml-auto">Updated {monthYear.format(new Date(p.pushedAt))}</span>}
              <span className="sr-only">(opens in a new tab)</span>
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}
