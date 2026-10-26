import { csvToParquet } from "./csv-to-parquet";
import { f1Analyst } from "./f1-analyst";
import type { CaseStudy } from "./types";

export type { Block, CaseStudy, FlowNode, Section } from "./types";

/** In display order. */
export const caseStudies: CaseStudy[] = [csvToParquet, f1Analyst];

export const repoBase = "https://github.com/MaxRecursion";
