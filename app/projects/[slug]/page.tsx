import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, GitHubIcon } from "@/components/icons";
import { Footer, Header } from "@/components/sections";
import { repoBase } from "@/content/case-studies";
import { projectCard, projectLinkText, projectPageBySlug, projectPageList } from "@/content/project-pages";
import { site } from "@/content/site";
import { trackClick } from "@/lib/analytics";
import { pageMetadata } from "@/lib/seo";
import { projectJsonLd, toJsonLd } from "@/lib/structured-data";

export function generateStaticParams() {
  return projectPageList.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const page = projectPageBySlug((await params).slug);
  if (!page) return {};
  const o = projectCard(page.repo);
  return pageMetadata({
    path: `/projects/${page.slug}`,
    title: page.title,
    description: page.description,
    // Projects without a screenshot share the site's card rather than having no preview at all.
    image: o.image ?? "/opengraph-image",
    imageAlt: o.image ? o.imageAlt : `${site.name}, ${site.role}`,
  });
}

const primary =
  "inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-85";
const secondary =
  "inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition hover:border-accent";

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const page = projectPageBySlug((await params).slug);
  if (!page) notFound();
  const o = projectCard(page.repo);
  const name = o.title ?? page.repo;
  const source = `${repoBase}/${page.repo}`;
  const others = projectPageList.filter((p) => p.slug !== page.slug);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(projectJsonLd(page)) }} />
      <Header />
      <main id="main" className="mx-auto max-w-3xl px-6 pb-24 pt-28 sm:pt-32">
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-muted">
          <ol className="flex flex-wrap gap-2">
            <li><Link href="/" className="rounded py-2 hover:text-foreground">{site.name}</Link> /</li>
            <li><Link href="/projects" className="rounded py-2 hover:text-foreground">Projects</Link> /</li>
            <li aria-current="page" className="text-foreground">{name}</li>
          </ol>
        </nav>

        <article>
          <header className="mt-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Project · {page.operatingSystem}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">{page.title}</h1>
            <p className="mt-5 text-lg leading-relaxed text-muted">{page.lead}</p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {o.liveUrl && (
                <a
                  href={o.liveUrl}
                  target="_blank"
                  rel="noopener"
                  className={primary}
                  {...trackClick({ name: "project_click", params: { project_name: page.repo, destination: o.liveLabel === "Download" ? "download" : "live_demo" } })}
                >
                  {o.liveLabel ?? `Open ${name}`}
                  <ArrowUpRight className="size-3.5" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
              <a
                href={source}
                target="_blank"
                rel="noreferrer noopener"
                className={secondary}
                {...trackClick({ name: "project_click", params: { project_name: page.repo, destination: "github" } })}
              >
                <GitHubIcon className="size-4" /> Source code
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </header>

          {o.image && (
            <figure className="relative mt-10 aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-surface">
              <Image src={o.image} alt={o.imageAlt ?? ""} fill priority sizes="(min-width: 768px) 720px, 100vw" className="object-cover object-top" />
            </figure>
          )}

          <section aria-labelledby="about-h" className="mt-12">
            <h2 id="about-h" className="text-2xl font-semibold tracking-tight">What {name} is</h2>
            <div className="mt-4 space-y-4 leading-relaxed text-muted">
              {page.about.map((para) => (
                <p key={para.slice(0, 32)}>{para}</p>
              ))}
            </div>
          </section>

          <section aria-labelledby="features-h" className="mt-12">
            <h2 id="features-h" className="text-2xl font-semibold tracking-tight">Features</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed text-muted marker:text-accent">
              {page.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </section>

          {o.tags && (
            <section aria-labelledby="stack-h" className="mt-12">
              <h2 id="stack-h" className="text-2xl font-semibold tracking-tight">Built with</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {o.tags.map((t) => (
                  <li key={t} className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm">{t}</li>
                ))}
              </ul>
              {o.technicalUrl && (
                <p className="mt-4 text-sm">
                  <a href={o.technicalUrl} target="_blank" rel="noreferrer noopener" className="text-accent underline decoration-accent/50 underline-offset-4 hover:decoration-accent">
                    Technical notes in the repository<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </p>
              )}
            </section>
          )}

          <section aria-labelledby="author-h" className="mt-12 rounded-xl border border-border bg-surface p-5">
            <h2 id="author-h" className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted">Who made it</h2>
            <p className="mt-2 leading-relaxed">
              {name} is built by <Link href="/#about" className="text-accent underline decoration-accent/50 underline-offset-4">{site.name}</Link>{" "}
              ({site.handle}), a senior software engineer in {site.location} who works on .NET and{" "}
              <Link href="/blazor" className="text-accent underline decoration-accent/50 underline-offset-4">Blazor</Link> applications by day.
            </p>
          </section>
        </article>

        <nav aria-labelledby="more-h" className="mt-16 border-t border-border pt-8">
          <h2 id="more-h" className="text-xl font-semibold tracking-tight">More projects</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {others.map((p) => (
              <li key={p.slug}>
                <Link href={`/projects/${p.slug}`} className="inline-block rounded py-1 text-accent underline decoration-accent/50 underline-offset-4 hover:decoration-accent">
                  {projectLinkText(p)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
      <Footer />
    </>
  );
}
