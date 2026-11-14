import type { Metadata } from "next";
import Link from "next/link";
import { Footer, Header } from "@/components/sections";
import { projectCard, projectPageList } from "@/content/project-pages";
import { site } from "@/content/site";
import { pageMetadata } from "@/lib/seo";
import { collectionJsonLd, toJsonLd } from "@/lib/structured-data";

const title = "Projects: AutoVerse, Tithi SIP planner, UNSEEN and more";
const description =
  "Projects by Akshay Kulkarni (MaxRecursion): AutoVerse car lessons, the Tithi SIP planner, UNSEEN F1 aero, Archeo, DiskLens, GitFlow Studio and more.";

export const metadata: Metadata = pageMetadata({ path: "/projects", title, description, image: "/opengraph-image", imageAlt: "Akshay Kulkarni, Senior Software Engineer" });

export default function ProjectsPage() {
  const items = projectPageList.map((p) => ({ name: projectCard(p.repo).title ?? p.repo, path: `/projects/${p.slug}` }));
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(collectionJsonLd({ path: "/projects", name: "Projects", description, items })) }}
      />
      <Header />
      <main id="main" className="mx-auto max-w-3xl px-6 pb-24 pt-28 sm:pt-32">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Selected work</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Projects by {site.name}</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          Things I build outside my day job as a senior .NET and Blazor engineer: interactive 3D explainers, a SIP
          planner for Indian mutual funds, native macOS apps and developer tools. Each links to the live app and its
          source on GitHub.
        </p>
        <ul className="mt-10 space-y-6">
          {projectPageList.map((p) => (
            <li key={p.slug} className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="text-xl font-semibold tracking-tight">
                <Link href={`/projects/${p.slug}`} className="rounded hover:text-accent">
                  {p.title}
                </Link>
              </h2>
              <p className="mt-2 leading-relaxed text-muted">{p.description}</p>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </>
  );
}
