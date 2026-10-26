export type FlowNode = {
  title: string;
  note?: string;
  /** Label on the arrow leading to the next node. */
  edge?: string;
};

export type Block =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; head: string[]; rows: string[][]; caption?: string }
  | { type: "flow"; label: string; nodes: FlowNode[] }
  | { type: "note"; text: string };

export type Section = { id: string; heading: string; blocks: Block[] };

export type CaseStudy = {
  slug: string;
  /** Repository name under github.com/MaxRecursion. */
  repo: string;
  title: string;
  /** Short title for cards and the page eyebrow. */
  kicker: string;
  /** One or two sentences: the question and the answer. */
  summary: string;
  /** The single most useful result, with its conditions, for the homepage card. */
  finding: string;
  stack: string[];
  facts: { label: string; value: string }[];
  sections: Section[];
  /** Files in the repository that back the claims above. */
  evidence: { label: string; path: string }[];
};
