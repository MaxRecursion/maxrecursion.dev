import { csvToParquet } from "@/content/case-studies/csv-to-parquet";
import { caseStudyCard } from "@/lib/og-card";

export const alt = `Case study: ${csvToParquet.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return caseStudyCard({ kicker: csvToParquet.kicker, title: csvToParquet.title });
}
