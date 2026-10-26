// Experience claims are checked against the LinkedIn profile: the career starts in September 2011,
// financial-services work starts in February 2014. That is 15+ and 12+ years as of late 2026,
// written so the sentence stays true without a date calculation.
// Employers are never named on the site; the day job is only ever called "CorpoRat-developer".
export const site = {
  name: "Akshay Kulkarni",
  handle: "MaxRecursion",
  url: "https://maxrecursion.dev",
  location: "Pune, India",
  role: "Senior Software Engineer",
  headline: "Senior Software Engineer | Finance & Systems Engineering",
  tagline: "Building things, one call stack at a time.",
  summary:
    "15+ years building software, 12+ of them in payments, mortgage and banking. Independently: data pipelines, native apps, interactive 3D and AI-powered tools.",
  // Hero copy follows the landing-page-design skill: no hyphens, and each headline entry is one
  // rendered line, broken where the thought breaks.
  hero: {
    headline: ["Banking software by day.", "Pipelines and 3D by night."],
    intro:
      "I'm Akshay Kulkarni, a senior software engineer in Pune. 15+ years shipping software, 12+ of them in payments, mortgage and banking. Outside work I build data pipelines, native macOS apps, interactive 3D explainers and LLM tools.",
    proof: "CorpoRat-developer since 2011",
  },
  description:
    "Akshay Kulkarni (MaxRecursion) is a senior software engineer in Pune with 15+ years of experience, 12+ in financial services, who also builds data pipelines, native macOS apps, interactive 3D explainers and LLM automation.",
  bio: [
    "I've been a CorpoRat-developer since 2011, and for the last twelve-plus years that has meant financial services: mortgage-domain applications for a banking client, a money-transfer product where I was technical lead, and today .NET and Blazor WebAssembly applications.",
    "Outside work I build what I can't stop thinking about, and I write up the engineering behind it: a streaming CSV-to-Parquet service, a measured comparison of query-engine topologies in the browser, a pipeline that tests whether the day you start a SIP matters, and an interactive 3D teardown of a 2026 F1 car.",
  ],
  links: {
    github: "https://github.com/MaxRecursion",
    linkedin: "https://www.linkedin.com/in/akshaykulkarni89",
  },
  experience: [
    { role: "Senior Software Engineer", period: "2023 – now" },
    { role: "Tech Lead · Technical Analyst", period: "2016 – 2023" },
    { role: "Software Engineering Analyst", period: "2014 – 2016" },
    { role: "Software Engineer", period: "2011 – 2014" },
  ],
  skills: [
    "C#",
    ".NET",
    "ASP.NET Core Web API",
    "ASP.NET MVC",
    "Blazor WebAssembly",
    "WCF",
    "SQL Server",
    "TypeScript",
    "React",
    "Next.js",
    "Swift & SwiftUI",
    "DuckDB & Parquet",
    "Python",
    "WebGL & Three.js",
    "Google Cloud",
    "LLM integrations",
    "Playwright",
  ],
} as const;
