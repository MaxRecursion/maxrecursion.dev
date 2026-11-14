import type { Metadata } from "next";
import { CaseStudyPage } from "@/components/case-study/CaseStudyPage";
import { f1Analyst } from "@/content/case-studies/f1-analyst";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: `/case-studies/${f1Analyst.slug}`,
  title: f1Analyst.seoTitle,
  description: f1Analyst.seoDescription,
  type: "article",
});

export default function Page() {
  return <CaseStudyPage study={f1Analyst} />;
}
