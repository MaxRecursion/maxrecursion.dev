import Link from "next/link";
import type { CaseStudy } from "@/content/case-studies";
import { repoBase } from "@/content/case-studies";
import { ArrowUpRight, GitHubIcon } from "@/components/icons";
import { trackClick } from "@/lib/analytics";

export function CaseStudyCard({ study }: { study: CaseStudy }) {
  const details = trackClick({ name: "project_click", params: { project_name: study.repo, destination: "project_details" } });
  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6 transition hover:border-accent/60 sm:p-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-accent">Case study · {study.kicker}</p>
      <h3 className="mt-3 text-xl font-semibold tracking-tight">
        <Link href={`/case-studies/${study.slug}`} className="rounded hover:underline hover:underline-offset-4" {...details}>
          {study.title}
        </Link>
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-muted">{study.summary}</p>
      <p className="mt-4 border-l-2 border-accent pl-4 text-sm leading-relaxed">
        <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.15em] text-muted">Key finding</span>
        {study.finding}
      </p>
      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
        {study.stack.map((t) => (
          <li key={t} className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] text-muted">
            {t}
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-wrap gap-2 pt-6">
        <Link
          href={`/case-studies/${study.slug}`}
          className="inline-flex min-h-11 items-center gap-1 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-85"
          {...details}
        >
          Read the case study
          <span className="sr-only">: {study.kicker}</span>
          <span aria-hidden="true">→</span>
        </Link>
        <a
          href={`${repoBase}/${study.repo}`}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:border-accent"
          {...trackClick({ name: "project_click", params: { project_name: study.repo, destination: "github" } })}
        >
          <GitHubIcon className="size-3.5" /> Source
          <ArrowUpRight className="size-3" />
          <span className="sr-only">
            : {study.kicker} on GitHub (opens in a new tab)
          </span>
        </a>
      </div>
    </article>
  );
}
