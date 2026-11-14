import type { MetadataRoute } from "next";
import { caseStudies } from "@/content/case-studies";
import { projectPageList } from "@/content/project-pages";
import { site } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // Only pages with a real content date carry lastModified: Google ignores a lastmod that changes on
  // every deploy whether or not the page did.
  const latestStudy = caseStudies.map((s) => s.updated ?? s.published).sort().at(-1);
  return [
    { url: site.url, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/projects`, changeFrequency: "weekly", priority: 0.8 },
    ...projectPageList.map((p) => ({
      url: `${site.url}/projects/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${site.url}/blazor`, lastModified: latestStudy, changeFrequency: "monthly", priority: 0.8 },
    { url: `${site.url}/case-studies`, lastModified: latestStudy, changeFrequency: "monthly", priority: 0.7 },
    ...caseStudies.map((study) => ({
      url: `${site.url}/case-studies/${study.slug}`,
      lastModified: study.updated ?? study.published,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
