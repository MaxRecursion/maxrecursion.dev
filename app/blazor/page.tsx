import type { Metadata } from "next";
import Link from "next/link";
import { Footer, Header } from "@/components/sections";
import { csvToParquet } from "@/content/case-studies/csv-to-parquet";
import { f1Analyst } from "@/content/case-studies/f1-analyst";
import { site } from "@/content/site";
import { pageMetadata } from "@/lib/seo";
import { collectionJsonLd, toJsonLd } from "@/lib/structured-data";

// A topic hub for "Blazor": the day job, the measured Blazor WebAssembly study, and the related .NET work.
// Every figure is quoted from the f1-analyst case study, which takes them from its repository.
const title = "Blazor WebAssembly engineering: DuckDB, performance, .NET";
const description =
  "Blazor WebAssembly work by Akshay Kulkarni: in-browser DuckDB query engines measured three ways, UI blocking, cancellation and payload size in .NET 10.";

export const metadata: Metadata = pageMetadata({ path: "/blazor", title, description, image: "/opengraph-image", imageAlt: "Akshay Kulkarni, Senior Software Engineer" });

const link = "text-accent underline decoration-accent/50 underline-offset-4 hover:decoration-accent";

const findings = [
  "Running DuckDB in-process on the Blazor UI thread gave the fastest engine times, but blocked the UI for 1,793 ms during a 1,780 ms query, and the query could not be cancelled.",
  "Running duckdb-wasm in a Web Worker kept the page responsive and cancelled a running query in 74 ms.",
  "Statically linking DuckDB into the .NET WebAssembly runtime works: it cross-compiles in 132 seconds, and the wasm payload grows from 2.9 MB to 29.5 MB.",
  "Querying ZSTD Parquet instead of JSON is what makes in-browser analytics practical: 43.2 MB against 483 MB for the same million rows.",
  "Blazor is not supported on the multithreaded .NET runtime in any shipped version, so off-UI-thread work means a Web Worker.",
];

export default function BlazorPage() {
  const items = [
    { name: f1Analyst.title, path: `/case-studies/${f1Analyst.slug}` },
    { name: csvToParquet.title, path: `/case-studies/${csvToParquet.slug}` },
  ];
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(collectionJsonLd({ path: "/blazor", name: "Blazor WebAssembly engineering", description, items })) }}
      />
      <Header />
      <main id="main" className="mx-auto max-w-3xl px-6 pb-24 pt-28 sm:pt-32">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Blazor · .NET · WebAssembly</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Blazor WebAssembly engineering</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          I&apos;m {site.name} ({site.handle}), a senior software engineer in {site.location}. My day job is building .NET
          and Blazor WebAssembly applications for financial services, and outside it I measure how far Blazor can be
          pushed in the browser.
        </p>

        <section aria-labelledby="study-h" className="mt-12">
          <h2 id="study-h" className="text-2xl font-semibold tracking-tight">Where should a Blazor app&apos;s query engine live?</h2>
          <p className="mt-4 leading-relaxed text-muted">
            The same million-row, 25-column workload, the same queries and the same UI run in three real Blazor
            WebAssembly apps: duckdb-wasm in a Web Worker, DuckDB statically linked into the .NET runtime on the UI
            thread, and .NET itself running in a Web Worker. Application code stays C# behind one{" "}
            <code className="font-mono text-sm">IQueryEngine</code> interface, so only the topology changes.
          </p>
          <h3 className="mt-8 text-lg font-semibold">What the measurements showed</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-muted marker:text-accent">
            {findings.map((f) => (
              <li key={f.slice(0, 32)}>{f}</li>
            ))}
          </ul>
          <p className="mt-6">
            <Link href={`/case-studies/${f1Analyst.slug}`} className={link}>
              Read the full Blazor WebAssembly + DuckDB case study
            </Link>
          </p>
        </section>

        <section aria-labelledby="dotnet-h" className="mt-12">
          <h2 id="dotnet-h" className="text-2xl font-semibold tracking-tight">Related .NET work</h2>
          <p className="mt-4 leading-relaxed text-muted">{csvToParquet.summary}</p>
          <p className="mt-4">
            <Link href={`/case-studies/${csvToParquet.slug}`} className={link}>
              Read the ASP.NET Core CSV to Parquet case study
            </Link>
          </p>
        </section>

        <section aria-labelledby="stack-h" className="mt-12">
          <h2 id="stack-h" className="text-2xl font-semibold tracking-tight">Day-to-day stack</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {site.skills.slice(0, 7).map((s) => (
              <li key={s} className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm">{s}</li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted">
            More about me on the <Link href="/#about" className={link}>home page</Link>, or see{" "}
            <Link href="/projects" className={link}>everything else I build</Link>.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
