import { f1Analyst } from "@/content/case-studies/f1-analyst";
import { caseStudyCard } from "@/lib/og-card";

export const alt = `Case study: ${f1Analyst.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return caseStudyCard({ kicker: f1Analyst.kicker, title: f1Analyst.title });
}
