export type ProjectOverride = {
  title?: string;
  description?: string;
  /** Path under /public, e.g. "/projects/disklens.png". Without one, the card draws a placeholder panel. */
  image?: string;
  tags?: string[];
  /** Live site; wins over the GitHub Pages URL and the repo's homepage field. */
  liveUrl?: string;
};

/** Featured projects, in display order. */
export const featured = ["ActiveAero_F1", "AutoVerse", "DataDrivenSIP", "Xposter", "DiskLens"];

/** Public repos left out of the site entirely. */
export const hidden = ["HealthVault"];

export const overrides: Record<string, ProjectOverride> = {
  ActiveAero_F1: {
    title: "UNSEEN: the 2026 F1 car, opened up",
    description:
      "An interactive 3D explainer of a 2026 Formula 1 car. Six stations, from downforce to active aero: change an input, watch the car and its live readouts respond, then see why.",
    tags: ["3D", "Physics", "F1"],
    image: "/projects/activeaero.jpg",
    liveUrl: "https://unseen.maxrecursion.dev",
  },
  AutoVerse: {
    image: "/projects/autoverse.jpg",
    liveUrl: "https://autoverse.maxrecursion.dev",
    description:
      "Interactive lessons on how cars work: engines, gearboxes, brakes and suspension, with live 3D labs and quizzes. Prerendered with Vite SSR.",
    tags: ["React", "3D", "Vite", "Playwright"],
  },
  DiskLens: {
    description:
      "Native macOS disk-space analyzer and safe cleaner. Read-only scans, an interactive treemap, APFS clone-aware reclaim estimates and approval-bound cleanup.",
    tags: ["Swift", "SwiftUI", "macOS", "CLI"],
  },
  DataDrivenSIP: {
    title: "Tithi: SIP Date Planner",
    description:
      "Does the day of the month you run a SIP matter? A nightly pipeline simulates every date across 994 Indian mutual funds and solves each XIRR to find out.",
    tags: ["Data pipeline", "Finance", "Node"],
    image: "/projects/tithi.jpg",
    liveUrl: "https://tithi.maxrecursion.dev",
  },
  f1analyst: {
    title: "F1 Analyst",
    description:
      "Client-side analytics on Blazor WebAssembly, measuring three local query-engine topologies over 1M rows.",
    tags: ["Blazor", "WebAssembly", "Benchmarks"],
  },
  Xposter: {
    description:
      "A local X automation system: Playwright timeline ingest, tweet scoring, RAG over Voyage embeddings, LLM replies and scheduled posts, with phone notifications.",
    tags: ["TypeScript", "SQLite", "Playwright", "RAG"],
  },
  CSVToParquet: {
    title: "CSV to Parquet",
    description:
      "A streaming service that converts multi-GB CSV files to Parquet with DuckDB, without ever holding a file in memory.",
  },
};
