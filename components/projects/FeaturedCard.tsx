import Image from "next/image";
import type { Project } from "@/lib/github";
import { ArrowUpRight, GitHubIcon } from "@/components/icons";

// A typographic stand-in for projects without a screenshot.
function Placeholder({ project }: { project: Project }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-end bg-[radial-gradient(70%_90%_at_15%_0%,color-mix(in_srgb,var(--accent)_28%,transparent),transparent_70%),radial-gradient(60%_80%_at_100%_100%,color-mix(in_srgb,var(--accent-2)_22%,transparent),transparent_70%)] p-6 transition duration-500 group-hover:scale-[1.03]">
      <p className="font-mono text-xs text-muted">
        $ git clone {project.url.replace("https://", "")}
      </p>
      <p className="mt-2 font-mono text-3xl font-semibold tracking-tight sm:text-4xl">{project.name}</p>
      {project.language && (
        <p className="mt-1 font-mono text-xs text-accent">{project.language}</p>
      )}
    </div>
  );
}

export function FeaturedCard({
  project,
  priority = false,
  wide = false,
}: {
  project: Project;
  priority?: boolean;
  /** Spans both grid columns from md up, with the image beside the text. */
  wide?: boolean;
}) {
  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition hover:border-accent/60 hover:shadow-[0_0_0_1px_var(--accent),0_20px_60px_-30px_var(--accent)] ${wide ? "md:h-full md:flex-row" : ""}`}
    >
      <a
        href={project.liveUrl ?? project.url}
        target="_blank"
        rel="noreferrer"
        tabIndex={-1}
        aria-hidden="true"
        className={`relative block aspect-[2/1] overflow-hidden border-b border-border bg-background ${wide ? "md:aspect-auto md:min-h-[280px] md:w-1/2 md:shrink-0 md:border-b-0 md:border-r" : ""}`}
      >
        {project.image ? (
          <Image
            src={project.image}
            alt=""
            fill
            sizes="(min-width: 768px) 480px, 100vw"
            priority={priority}
            className="object-cover object-top transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <Placeholder project={project} />
        )}
      </a>
      <div className={`flex flex-1 flex-col p-6 ${wide ? "md:justify-center md:p-10" : ""}`}>
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold tracking-tight">{project.title}</h3>
          {project.language && (
            <span className="shrink-0 font-mono text-xs text-muted">{project.language}</span>
          )}
        </div>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{project.description}</p>
        {project.tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tags">
            {project.tags.map((tag) => (
              <li key={tag} className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] text-muted">
                {tag}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-5 flex gap-2">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition hover:opacity-85"
            >
              Live <ArrowUpRight className="size-3.5" />
              <span className="sr-only">: {project.title}</span>
            </a>
          )}
          <a
            href={project.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-sm font-medium transition hover:border-accent"
          >
            <GitHubIcon className="size-3.5" /> Code
            <span className="sr-only">: {project.title}</span>
          </a>
        </div>
      </div>
    </article>
  );
}
