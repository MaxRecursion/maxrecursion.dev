import type { Metadata } from "next";
import { CaseStudyPage } from "@/components/case-study/CaseStudyPage";
import { csvToParquet } from "@/content/case-studies/csv-to-parquet";

const path = `/case-studies/${csvToParquet.slug}`;

export const metadata: Metadata = {
  title: `${csvToParquet.kicker} case study`,
  description: csvToParquet.summary,
  alternates: { canonical: path },
  openGraph: { type: "article", url: path, title: csvToParquet.title, description: csvToParquet.summary },
};

export default function Page() {
  return <CaseStudyPage study={csvToParquet} />;
}
