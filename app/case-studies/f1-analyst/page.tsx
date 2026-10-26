import type { Metadata } from "next";
import { CaseStudyPage } from "@/components/case-study/CaseStudyPage";
import { f1Analyst } from "@/content/case-studies/f1-analyst";

const path = `/case-studies/${f1Analyst.slug}`;

export const metadata: Metadata = {
  title: `${f1Analyst.kicker} case study`,
  description: f1Analyst.summary,
  alternates: { canonical: path },
  openGraph: { type: "article", url: path, title: f1Analyst.title, description: f1Analyst.summary },
};

export default function Page() {
  return <CaseStudyPage study={f1Analyst} />;
}
