// A detail page per featured project at /projects/<slug>. Each one targets the words people search for
// (the product name and the problem it solves) and links to the live app and the source.
// Every claim here restates the project's entry in projects.ts or its repository; nothing is added
// that the repository does not back.
import { featured, overrides } from "./projects";

export type ProjectPage = {
  /** URL segment under /projects. Carries the search phrase where the name alone is ambiguous. */
  slug: string;
  /** <title> before the site suffix; 60 characters or fewer with the suffix where possible. */
  title: string;
  /** Meta description, 155 characters or fewer so Google shows it whole. */
  description: string;
  /** Lead paragraph under the H1. */
  lead: string;
  /** Longer explanation: what it is, who it is for, how it works. */
  about: string[];
  /** Short, factual feature list. */
  features: string[];
  /** schema.org applicationCategory. */
  category: string;
  operatingSystem: string;
  free?: boolean;
};

export const projectPages: Record<string, ProjectPage> = {
  AutoVerse: {
    slug: "autoverse",
    title: "AutoVerse: free interactive lessons on how cars work",
    description:
      "AutoVerse teaches how cars work, from engines and gearboxes to brakes and suspension, with free interactive 3D labs and quizzes in the browser.",
    lead: "AutoVerse is a free, browser-based course on how cars work. Each lesson pairs a plain explanation with a live 3D lab you can turn and take apart, and a quiz to check what stuck.",
    about: [
      "It covers the parts of a car most people use every day without seeing: the four-stroke engine, the gearbox, the brakes and the suspension. Instead of static diagrams, each topic has a 3D model built with React Three Fiber that you can rotate and interact with while you read.",
      "Under the hood, AutoVerse is a Vite and React app that prerenders every route to static HTML, so lessons load quickly and are readable by search engines. Lesson content is checked by validation scripts, and the app is covered by Vitest and Playwright test suites.",
    ],
    features: [
      "Lessons on engines, gearboxes, brakes and suspension",
      "Interactive 3D labs built with React Three Fiber",
      "Quizzes after each topic",
      "Free, in the browser, with no sign-up",
    ],
    category: "EducationalApplication",
    operatingSystem: "Web browser",
    free: true,
  },
  DataDrivenSIP: {
    slug: "tithi-sip-planner",
    title: "Tithi SIP planner: does your SIP date matter?",
    description:
      "Tithi is a SIP planner for Indian mutual funds: it compares every SIP start date from the 1st to the 28th over a fund's full NAV history.",
    lead: "Tithi is a SIP planner that answers one question with data: does the day of the month you start a SIP change your returns? Pick an Indian mutual fund and it compares every start date from the 1st to the 28th over the fund's full NAV history.",
    about: [
      "A SIP (systematic investment plan) invests a fixed amount in a mutual fund on the same date every month. Advice about the best SIP date is common; evidence is not. Tithi runs the same monthly SIP on each of the 28 possible dates, computes the XIRR for each, and shows which date did best and by how much.",
      "When the spread between the best and worst dates is negligible, Tithi says so and calls it noise rather than recommending a date. A nightly GitHub Actions pipeline refreshes NAV data for more than 1,000 funds and solves each XIRR by bisection. The site itself is fully static, with a prerendered page per fund.",
    ],
    features: [
      "SIP date comparison for 1,000+ Indian mutual funds",
      "XIRR for every start date from the 1st to the 28th",
      "Uses each fund's full NAV history, refreshed nightly",
      "Says 'noise' when the difference between dates is negligible",
    ],
    category: "FinanceApplication",
    operatingSystem: "Web browser",
  },
  ActiveAero_F1: {
    slug: "unseen-f1-aerodynamics",
    title: "UNSEEN: interactive 3D F1 aerodynamics explainer",
    description:
      "UNSEEN is an interactive 3D explainer of a 2026 Formula 1 car: change speed, wing mode or ride height and watch downforce, drag and energy respond.",
    lead: "UNSEEN is an interactive 3D explainer of a 2026 Formula 1 car. Change the speed, the active-aero wing mode or the ride height, and watch downforce, drag, power and energy respond live.",
    about: [
      "It is organised as six stations, each driven by a documented physics model that is kept separate from the Three.js scene, so the numbers can be checked without the graphics.",
      "Quantities that teams do not publish are labelled as estimates, and if the detailed car model fails to load, a procedural car is drawn instead so the explainer still works.",
    ],
    features: [
      "Six interactive stations on 2026 F1 aerodynamics and energy",
      "Live downforce, drag and power readouts",
      "Physics models documented and separate from rendering",
      "Built with Three.js and WebGL 2, tested with Vitest",
    ],
    category: "EducationalApplication",
    operatingSystem: "Web browser",
  },
  Archeo: {
    slug: "archeo",
    title: "Archeo: interactive architecture maps of GitHub repos",
    description:
      "Archeo turns public GitHub repos into interactive architecture maps: trace JavaScript and TypeScript imports and inspect source at the analysed commit.",
    lead: "Archeo, the codebase archaeologist, turns a public GitHub repository into an interactive architecture map. Trace JavaScript and TypeScript imports, explore modules and packages, and inspect source at the exact commit analysed.",
    about: [
      "Graph connections come from deterministic source parsing, so every edge is tied to a file and a line. Maps can be exported as SVG.",
      "Change impact compares branches or commits using an explicitly simulated demo, with optional self-hosted Laya decisions once an operator has set it up.",
    ],
    features: [
      "Architecture maps from any public GitHub repository",
      "Import graphs for JavaScript and TypeScript",
      "Source view pinned to the analysed commit",
      "SVG export",
    ],
    category: "DeveloperApplication",
    operatingSystem: "Web browser",
  },
  irontrail: {
    slug: "irontrail",
    title: "IRONTRAIL: Ojas's Monster Rally browser game",
    description:
      "IRONTRAIL is a monster-truck browser game: ten tracks, nitro jumps, a cannon and a boss, with touch, keyboard and gamepad controls in one offline file.",
    lead: "IRONTRAIL, Ojas's Monster Rally, is a red-and-black monster-truck adventure. Race ten tracks, charge nitro through jumps and roadside smashes, stop a giant with one cannon shot, and challenge Iron Maw.",
    about: [
      "The game runs physical suspension and vehicle collisions at a fixed 120 Hz with interpolated Canvas rendering, plus slow-motion cannon shots, synthesized music, ghost replays and upgrades, all in one offline HTML file.",
      "Picture controls and live star goals make it playable for young children, and it supports touch, keyboard and gamepad.",
    ],
    features: [
      "Ten tracks and a boss race",
      "Touch, keyboard and gamepad controls",
      "Ghost replays and upgrades",
      "Runs offline from a single HTML file",
    ],
    category: "GameApplication",
    operatingSystem: "Web browser",
  },
  DiskLens: {
    slug: "disklens",
    title: "DiskLens: macOS disk space analyzer for developers",
    description:
      "DiskLens is a native macOS disk space analyzer for developer machines, with an interactive treemap and cleanup suggestions that never act without approval.",
    lead: "DiskLens is a native macOS disk-space analyzer built for developer machines. It shows where the space went in an interactive treemap and recommends cleanups, none of which run without a preview and your explicit approval.",
    about: [
      "Scans are read-only and attribute every byte to exactly one category, so totals add up. Reclaimable-space estimates account for APFS clones and hard links, which naive tools double count.",
    ],
    features: [
      "Interactive treemap of disk usage",
      "Developer-aware categories and cleanup suggestions",
      "Read-only scans; nothing is deleted without approval",
      "APFS clone and hard-link aware estimates",
    ],
    category: "UtilitiesApplication",
    operatingSystem: "macOS",
  },
  "gitflow-studio": {
    slug: "gitflow-studio",
    title: "GitFlow Studio: native macOS Git client with 3-way merge",
    description:
      "GitFlow Studio is a native macOS Git client with an editable three-way merge workspace, line staging, branches, worktrees and visual conflict resolution.",
    lead: "GitFlow Studio is a native macOS Git client with an editable three-way merge workspace. Stage individual lines, manage branches and worktrees, and resolve merge, rebase, cherry-pick and revert conflicts visually.",
    about: [
      "It is written in SwiftUI and TextKit 2 on top of the installed Git, with 79 core tests, native UI regression coverage on Apple Silicon and Intel, and real Instruments captures.",
      "It is an engineering preview: Developer ID signing and notarization are still pending.",
    ],
    features: [
      "Editable three-way merge workspace",
      "Line-level staging",
      "Branch and worktree management",
      "Visual merge, rebase, cherry-pick and revert conflicts",
    ],
    category: "DeveloperApplication",
    operatingSystem: "macOS",
  },
  Xposter: {
    slug: "xposter",
    title: "Xposter: local LLM automation for X",
    description:
      "Xposter is a local automation system for X: scheduled timeline scraping, scoring, LLM-drafted replies and posts, and a dashboard with phone notifications.",
    lead: "Xposter is a local automation system for X: scheduled timeline scraping, scoring and filtering, LLM-drafted replies and posts, and a dashboard with phone notifications.",
    about: [
      "Playwright ingests the timeline and feeds a scoring pipeline, with optional retrieval-augmented context from Voyage embeddings. Everything sits in a single SQLite database behind a local dashboard, covered by a Vitest suite.",
    ],
    features: [
      "Scheduled timeline ingest with Playwright",
      "Scoring and filtering pipeline",
      "LLM-drafted replies with optional RAG context",
      "Local dashboard and phone notifications",
    ],
    category: "DeveloperApplication",
    operatingSystem: "macOS, Linux",
  },
};

export type ProjectPageEntry = ProjectPage & { repo: string };

/** Detail pages in the homepage's display order. */
export const projectPageList: ProjectPageEntry[] = featured.flatMap((repo) =>
  projectPages[repo] ? [{ ...projectPages[repo], repo }] : [],
);

export const projectPageBySlug = (slug: string) => projectPageList.find((p) => p.slug === slug);

/** Short link text that keeps the search phrase: the page title before its colon ("Tithi SIP planner"). */
export const projectLinkText = (p: ProjectPage) => p.title.split(":")[0];

/** Display name, live URL and the rest of the curated card data for a detail page. */
export const projectCard = (repo: string) => overrides[repo] ?? {};
