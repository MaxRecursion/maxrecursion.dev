import type { Metadata } from "next";
import Link from "next/link";
import { Footer, Header } from "@/components/sections";
import { caseStudies } from "@/content/case-studies";
import { pageMetadata } from "@/lib/seo";
import { collectionJsonLd, toJsonLd } from "@/lib/structured-data";

const title = "Engineering case studies: Blazor, .NET, DuckDB and Parquet";
const description =
  "Engineering write-ups by Akshay Kulkarni: Blazor WebAssembly query engines with DuckDB, and streaming CSV to Parquet in ASP.NET Core in bounded memory.";

export const metadata: Metadata = pageMetadata({ path: "/case-studies", title, description, image: "/opengraph-image", imageAlt: "Akshay Kulkarni, Senior Software Engineer" });

export default function CaseStudiesPage() {
  const items = caseStudies.map((s) => ({ name: s.title, path: `/case-studies/${s.slug}` }));
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(collectionJsonLd({ path: "/case-studies", name: "Case studies", description, items })) }}
      />
      <Header />
      <main id="main" className="mx-auto max-w-3xl px-6 pb-24 pt-28 sm:pt-32">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Engineering write-ups</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Case studies</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          Projects written up with their constraints, decisions and trade-offs, and with what the evidence does and
          does not show. Every number comes from the linked repository.
        </p>
        <ul className="mt-10 space-y-6">
          {caseStudies.map((s) => (
            <li key={s.slug} className="rounded-2xl border border-border bg-surface p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-accent">{s.kicker} · {s.stack.slice(0, 3).join(", ")}</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">
                <Link href={`/case-studies/${s.slug}`} className="rounded hover:text-accent">
                  {s.title}
                </Link>
              </h2>
              <p className="mt-2 leading-relaxed text-muted">{s.summary}</p>
              <p className="mt-3 text-sm leading-relaxed">{s.finding}</p>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </>
  );
}
