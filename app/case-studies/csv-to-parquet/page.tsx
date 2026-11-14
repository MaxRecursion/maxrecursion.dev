import type { Metadata } from "next";
import { CaseStudyPage } from "@/components/case-study/CaseStudyPage";
import { csvToParquet } from "@/content/case-studies/csv-to-parquet";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: `/case-studies/${csvToParquet.slug}`,
  title: csvToParquet.seoTitle,
  description: csvToParquet.seoDescription,
  type: "article",
});

export default function Page() {
  return <CaseStudyPage study={csvToParquet} />;
}
