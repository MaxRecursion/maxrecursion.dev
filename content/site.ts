// Experience claims are checked against the LinkedIn profile: the career starts in September 2011
// (Fasttrack), financial-services work starts in February 2014 (Accenture). That is 15+ and 12+
// years as of late 2026, written so the sentence stays true without a date calculation.
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
  description:
    "Akshay Kulkarni (MaxRecursion) is a senior software engineer in Pune with 15+ years of experience, 12+ in financial services, who also builds data pipelines, native macOS apps, interactive 3D explainers and LLM automation.",
  bio: [
    "I've been writing software professionally since 2011, and for the last twelve-plus years that has meant financial services: mortgage-domain applications for a banking client at Accenture, a money-transfer product at Fiserv where I was technical lead, and today .NET and Blazor WebAssembly applications at Deutsche Bank.",
    "Outside work I build what I can't stop thinking about, and I write up the engineering behind it: a streaming CSV-to-Parquet service, a measured comparison of query-engine topologies in the browser, a pipeline that tests whether the day you start a SIP matters, and an interactive 3D teardown of a 2026 F1 car.",
  ],
  links: {
    github: "https://github.com/MaxRecursion",
    linkedin: "https://www.linkedin.com/in/akshaykulkarni89",
  },
  experience: [
    { company: "Deutsche Bank", role: "Senior Software Engineer", period: "2023 – now" },
    { company: "Fiserv", role: "Tech Lead · Technical Analyst", period: "2016 – 2023" },
    { company: "Accenture", role: "Software Engineering Analyst", period: "2014 – 2016" },
    { company: "Fasttrack Software Services", role: "Software Engineer", period: "2011 – 2014" },
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
