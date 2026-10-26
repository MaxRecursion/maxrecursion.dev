import type { MetadataRoute } from "next";
import { caseStudies } from "@/content/case-studies";
import { site } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, changeFrequency: "weekly", priority: 1 },
    ...caseStudies.map((study) => ({
      url: `${site.url}/case-studies/${study.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
