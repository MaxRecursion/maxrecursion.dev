import Image from "next/image";
import type { Project } from "@/lib/github";
import { ArrowUpRight, GitHubIcon } from "@/components/icons";
import { FlowPreview } from "./FlowPreview";

const primary =
  "inline-flex min-h-11 items-center gap-1 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-85";
const secondary =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:border-accent";

function Preview({ project }: { project: Project }) {
  if (project.image) {
    return (
      <Image
        src={project.image}
        alt={project.imageAlt ?? ""}
        fill
        // Cards are about half the 976px content width from md up, and full width below. They sit below
        // the full-height hero, so they load lazily instead of competing with it for bandwidth.
        sizes="(min-width: 768px) 488px, 100vw"
        className="object-cover object-top"
      />
    );
  }
  if (project.flow) return <FlowPreview {...project.flow} />;
  return (
    <div className="absolute inset-0 grid place-items-center bg-background p-6">
      <p className="font-mono text-2xl font-semibold tracking-tight">{project.title}</p>
    </div>
  );
}

export function FeaturedCard({
  project,
  wide = false,
}: {
  project: Project;
  /** Spans both grid columns from md up, with the preview beside the text. */
  wide?: boolean;
}) {
  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition hover:border-accent/60 ${wide ? "md:flex-row" : ""}`}
    >
      <div
        className={`relative aspect-[16/10] shrink-0 overflow-hidden border-b border-border bg-background ${wide ? "md:w-1/2 md:border-b-0 md:border-r" : ""}`}
      >
        <Preview project={project} />
      </div>
      <div className={`flex flex-1 flex-col p-6 ${wide ? "md:justify-center md:p-10" : ""}`}>
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-semibold tracking-tight">{project.title}</h3>
          {project.language && <span className="shrink-0 pt-1 font-mono text-xs text-muted">{project.language}</span>}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">{project.description}</p>
        {project.highlight && (
          <p className="mt-4 text-sm leading-relaxed">
            <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.15em] text-accent">
              Engineering
            </span>
            {project.highlight}
          </p>
        )}
        {project.tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
            {project.tags.map((tag) => (
              <li key={tag} className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] text-muted">
                {tag}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-6">
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noreferrer noopener" className={primary}>
              {project.liveLabel} <ArrowUpRight className="size-3.5" />
              <span className="sr-only">
                : {project.title} (opens in a new tab)
              </span>
            </a>
          )}
          <a href={project.url} target="_blank" rel="noreferrer noopener" className={secondary}>
            <GitHubIcon className="size-3.5" /> Source
            <span className="sr-only">
              : {project.title} on GitHub (opens in a new tab)
            </span>
          </a>
        </div>
      </div>
    </article>
  );
}
