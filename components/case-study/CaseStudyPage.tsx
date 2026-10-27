import Link from "next/link";
import type { Block, CaseStudy } from "@/content/case-studies";
import { repoBase } from "@/content/case-studies";
import { ArrowUpRight, GitHubIcon } from "@/components/icons";
import { Footer, Header } from "@/components/sections";
import { trackClick } from "@/lib/analytics";
import { Flow } from "./Flow";

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "p":
      return <p className="leading-relaxed text-muted">{block.text}</p>;
    case "list":
      return (
        <ul className="list-disc space-y-2 pl-5 leading-relaxed text-muted marker:text-accent">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "table":
      return (
        // A scrollable region must be reachable by keyboard so wide tables can be scrolled without a mouse.
        <div
          role="region"
          aria-label={block.caption ?? "Table"}
          tabIndex={0}
          className="overflow-x-auto rounded-xl border border-border"
        >
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            {block.caption && <caption className="border-b border-border px-4 py-3 text-left text-xs text-muted">{block.caption}</caption>}
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted">
              <tr>
                {block.head.map((h, i) => (
                  <th key={`${h}-${i}`} scope="col" className="px-4 py-2.5 font-mono font-medium">
                    {h || <span className="sr-only">Item</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.join("|")} className="border-t border-border align-top">
                  {row.map((cell, i) =>
                    i === 0 ? (
                      <th key={cell} scope="row" className="px-4 py-2.5 font-medium">
                        {cell}
                      </th>
                    ) : (
                      <td key={`${cell}-${i}`} className="px-4 py-2.5 text-muted">
                        {cell}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "flow":
      return <Flow label={block.label} nodes={block.nodes} />;
    case "note":
      return (
        <p className="rounded-lg border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-muted">
          {block.text}
        </p>
      );
  }
}

export function CaseStudyPage({ study }: { study: CaseStudy }) {
  const source = `${repoBase}/${study.repo}`;
  const sourceClick = trackClick({ name: "project_click", params: { project_name: study.repo, destination: "github" } });
  return (
    <>
      <Header />
      <main id="main" className="mx-auto max-w-3xl px-6 pb-24 pt-28 sm:pt-32">
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-muted">
          <Link href="/#case-studies" className="rounded py-2 hover:text-foreground">
            ← All case studies
          </Link>
        </nav>

        <article>
          <header className="mt-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Case study · {study.kicker}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">{study.title}</h1>
            <p className="mt-5 text-lg leading-relaxed text-muted">{study.summary}</p>

            <dl className="mt-8 grid gap-4 rounded-xl border border-border bg-surface p-5 text-sm sm:grid-cols-3">
              {study.facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted">{fact.label}</dt>
                  <dd className="mt-1 leading-snug">{fact.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href={source}
                target="_blank"
                rel="noreferrer noopener"
                {...sourceClick}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-85"
              >
                <GitHubIcon className="size-4" /> Source code
                <ArrowUpRight className="size-3.5" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <ul className="flex flex-wrap gap-1.5" aria-label="Technologies">
                {study.stack.map((t) => (
                  <li key={t} className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] text-muted">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </header>

          <nav aria-label="On this page" className="mt-10 rounded-xl border border-border p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted">On this page</p>
            <ol className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              {study.sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="inline-block rounded py-1 text-muted hover:text-foreground">
                    {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {study.sections.map((section) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-h`} className="mt-14 scroll-mt-24">
              <h2 id={`${section.id}-h`} className="text-2xl font-semibold tracking-tight">
                {section.heading}
              </h2>
              <div className="mt-4 space-y-4">
                {section.blocks.map((block, i) => (
                  <BlockView key={i} block={block} />
                ))}
              </div>
            </section>
          ))}

          <section aria-labelledby="evidence-h" className="mt-14 border-t border-border pt-8">
            <h2 id="evidence-h" className="text-xl font-semibold tracking-tight">
              Evidence in the repository
            </h2>
            <ul className="mt-4 space-y-2 text-sm">
              {study.evidence.map((e) => (
                <li key={e.path}>
                  <a
                    href={`${source}/${/\.[a-z0-9]+$/i.test(e.path) ? "blob" : "tree"}/main/${e.path}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    {...sourceClick}
                    className="inline-flex items-center gap-1.5 rounded py-1 text-accent underline decoration-accent/50 underline-offset-4 hover:decoration-accent"
                  >
                    {e.label}
                    <span className="font-mono text-xs text-muted">{e.path}</span>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
