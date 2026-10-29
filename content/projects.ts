export type ProjectOverride = {
  title?: string;
  /** What it is and the problem it solves. */
  description?: string;
  /** The most interesting engineering characteristic, stated only where the repo supports it. */
  highlight?: string;
  /** Four at most; a concise stack, not a badge wall. */
  tags?: string[];
  /** Path under /public. Without one, `flow` (if set) or a plain panel is drawn. */
  image?: string;
  /** Alt text for `image`: says what the screenshot shows. */
  imageAlt?: string;
  /** Pipeline stages drawn instead of a screenshot when the project has none. */
  flow?: { label: string; steps: string[] };
  /** Live site or download; wins over the GitHub Pages URL and the repo's homepage field. */
  liveUrl?: string;
  /** Button label for `liveUrl`. Defaults to "Live demo". */
  liveLabel?: string;
  /** Source-backed architecture or integration notes. */
  technicalUrl?: string;
};

/** Featured projects, in display order. */
export const featured = ["Archeo", "ActiveAero_F1", "AutoVerse", "DataDrivenSIP", "Xposter", "DiskLens"];

/** Repos that have a write-up under /case-studies. Shown in their own section, not in the grid. */
export const caseStudyRepos = ["CSVToParquet", "f1analyst"];

/** Public repos left out of the site entirely. */
export const hidden = ["HealthVault"];

export const overrides: Record<string, ProjectOverride> = {
  Archeo: {
    title: "Archeo — Codebase Archaeologist",
    description:
      "Turn public GitHub repositories into interactive architecture maps. Trace JavaScript and TypeScript imports, explore modules and packages, and inspect source at the exact commit analyzed.",
    highlight:
      "Deterministic source parsing ties graph connections to files and lines, with SVG export. Change impact compares branches or commits using a free, explicitly simulated demo; live Jev decisions require operator setup.",
    tags: ["React + Vite", "TypeScript", "React Flow", "Jev"],
    image: "/projects/archeo.png",
    imageAlt:
      "Archeo's landing page with the 'Understand any codebase' headline, a GitHub repository form and an illustrative dependency graph.",
    liveUrl: "https://archeo.maxrecursion.dev",
    technicalUrl: "https://github.com/MaxRecursion/Archeo/blob/main/docs/ARCHITECTURE.md",
  },
  ActiveAero_F1: {
    title: "UNSEEN",
    description:
      "An interactive 3D explainer of a 2026 Formula 1 car. Change speed, wing mode or ride height and watch downforce, drag, power and energy respond live.",
    highlight:
      "Six stations driven by documented physics models kept separate from the Three.js scene. Unpublished quantities are labelled as estimates, and a procedural car loads if the model fails.",
    tags: ["Three.js", "TypeScript", "WebGL 2", "Vitest"],
    image: "/projects/unseen.jpg",
    imageAlt:
      "UNSEEN's downforce station: a 3D Formula 1 car on a rolling road with force readouts, a speed slider and a force-versus-speed chart.",
    liveUrl: "https://unseen.maxrecursion.dev",
  },
  AutoVerse: {
    description:
      "Free interactive lessons on how cars work, from engines and gearboxes to brakes and suspension, with live 3D labs and quizzes.",
    highlight:
      "React Three Fiber labs inside a Vite app that prerenders its routes to static HTML. Lesson content is checked by validation scripts and the app by Vitest and Playwright suites.",
    tags: ["React", "React Three Fiber", "TypeScript", "Playwright"],
    image: "/projects/autoverse.jpg",
    imageAlt:
      "AutoVerse's home page with the headline 'Understand Every Moving Part' beside a 3D cutaway of a four-stroke engine.",
    liveUrl: "https://autoverse.maxrecursion.dev",
  },
  DataDrivenSIP: {
    title: "Tithi",
    description:
      "Does the day of the month you start a SIP matter? For one Indian mutual fund, Tithi compares every start date from the 1st to the 28th over its full NAV history.",
    highlight:
      "A nightly GitHub Actions pipeline refreshes NAV data for 1,000+ funds and solves each XIRR by bisection. The site is fully static with a prerendered page per fund, and says 'noise' when the spread is negligible.",
    tags: ["React", "TypeScript", "Data pipeline", "Playwright"],
    image: "/projects/tithi.jpg",
    imageAlt:
      "Tithi's answer for one mutual fund: 'The 24th' as the best SIP day, a 'Thin edge' verdict and three supporting figures.",
    liveUrl: "https://tithi.maxrecursion.dev",
  },
  Xposter: {
    description:
      "A local automation system for X: scheduled timeline scraping, scoring and filtering, LLM-drafted replies and posts, and a dashboard with phone notifications.",
    highlight:
      "Playwright ingest feeding a scoring pipeline, optional RAG context from Voyage embeddings, and a single SQLite database behind a local dashboard, covered by a Vitest suite.",
    tags: ["TypeScript", "Playwright", "SQLite", "RAG"],
    flow: {
      label: "Reply pipeline, 5× a day",
      steps: ["Scrape timeline", "Filter and score", "Draft with an LLM", "Notify or post"],
    },
  },
  DiskLens: {
    description:
      "A native macOS disk-space analyzer for developer machines: an interactive treemap and cleanup recommendations that nothing acts on without a preview and an explicit approval.",
    highlight:
      "Scans are read-only and attribute every byte to exactly one category, with reclaimable-space estimates that account for APFS clones and hard links.",
    tags: ["Swift", "SwiftUI", "APFS", "CLI"],
    image: "/projects/disklens.jpg",
    imageAlt:
      "DiskLens's explorer: an interactive treemap of disk usage with an inspector showing the selected folder's size and category.",
    liveUrl: "https://github.com/MaxRecursion/DiskLens/releases/latest",
    liveLabel: "Download",
  },
};
