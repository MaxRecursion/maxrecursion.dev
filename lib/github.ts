import { cacheLife, cacheTag } from "next/cache";
import { caseStudyRepos, featured, hidden, overrides } from "@/content/projects";
import { site } from "@/content/site";

type GitHubRepo = {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  has_pages: boolean;
  fork: boolean;
  archived: boolean;
  private: boolean;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  pushed_at: string;
};

export type Project = {
  name: string;
  title: string;
  description: string;
  highlight?: string;
  url: string;
  liveUrl?: string;
  liveLabel: string;
  technicalUrl?: string;
  language?: string;
  tags: string[];
  stars: number;
  pushedAt?: string;
  featured: boolean;
  image?: string;
  imageAlt?: string;
  flow?: { label: string; steps: string[] };
};

const repoUrl = (name: string) => `https://github.com/${site.handle}/${name}`;

function liveUrlFor(repo: GitHubRepo): string | undefined {
  if (repo.has_pages) {
    return `https://${site.handle.toLowerCase()}.github.io/${repo.name}/`;
  }
  const homepage = repo.homepage?.trim();
  if (!homepage) return undefined;
  try {
    const url = new URL(homepage.startsWith("http") ? homepage : `https://${homepage}`);
    if (url.hostname === "github.com" || url.hostname.endsWith(".github.com")) return undefined;
    url.protocol = "https:";
    return url.toString();
  } catch {
    return undefined;
  }
}

function toProject(repo: GitHubRepo): Project {
  const o = overrides[repo.name] ?? {};
  return {
    name: repo.name,
    title: o.title ?? repo.name,
    description: o.description ?? repo.description ?? "",
    highlight: o.highlight,
    url: repo.html_url,
    liveUrl: o.liveUrl ?? liveUrlFor(repo),
    liveLabel: o.liveLabel ?? "Live demo",
    technicalUrl: o.technicalUrl,
    language: repo.language ?? undefined,
    tags: o.tags ?? (repo.topics ?? []).slice(0, 4),
    stars: repo.stargazers_count,
    pushedAt: repo.pushed_at,
    featured: featured.includes(repo.name),
    image: o.image,
    imageAlt: o.imageAlt,
    flow: o.flow,
  };
}

type FetchResult = { ok: true; projects: Project[] } | { ok: false; reason: string };

/**
 * Public repositories from the GitHub API. A success is cached for an hour. A failure is returned,
 * never thrown (an error inside a cache scope fails the whole prerender, even when caught by the
 * caller), and cached for only five minutes so a rate limit or outage is retried soon.
 */
async function fetchProjects(): Promise<FetchResult> {
  "use cache";
  cacheTag("repos");

  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  try {
    const res = await fetch(
      `https://api.github.com/users/${site.handle}/repos?per_page=100&type=owner&sort=pushed`,
      { headers, signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) {
      const limited = res.headers.get("x-ratelimit-remaining") === "0";
      throw new Error(`GitHub API responded ${res.status}${limited ? " (rate limited)" : ""}`);
    }
    const repos = (await res.json()) as GitHubRepo[];
    cacheLife("hours");
    return {
      ok: true,
      projects: repos
        .filter((r) => !r.fork && !r.archived && !r.private && !hidden.includes(r.name))
        .map(toProject),
    };
  } catch (error) {
    cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
    return { ok: false, reason: error instanceof Error ? error.message : "unknown error" };
  }
}

/** The featured projects from site config alone, for when GitHub can't be reached. */
function fallbackProjects(): Project[] {
  return featured.map((name) => {
    const o = overrides[name] ?? {};
    return {
      name,
      title: o.title ?? name,
      description: o.description ?? "",
      highlight: o.highlight,
      url: repoUrl(name),
      liveUrl: o.liveUrl,
      liveLabel: o.liveLabel ?? "Live demo",
      technicalUrl: o.technicalUrl,
      tags: o.tags ?? [],
      stars: 0,
      featured: true,
      image: o.image,
      imageAlt: o.imageAlt,
      flow: o.flow,
    };
  });
}

export type ProjectFeed = {
  /** Featured projects in configured order. */
  featured: Project[];
  /** Everything else that is public, newest push first. Empty when GitHub is unreachable. */
  others: Project[];
  /** True when the live feed failed and the featured list came from site config. */
  degraded: boolean;
};

/** The homepage's project data. Never throws: a GitHub failure degrades to the curated list. */
export async function getProjectFeed(): Promise<ProjectFeed> {
  const result = await fetchProjects();
  const degraded = !result.ok;
  if (!result.ok) console.error(`[projects] GitHub feed unavailable, using the curated list: ${result.reason}`);
  const projects = result.ok ? result.projects : fallbackProjects();
  const byName = new Map(projects.map((p) => [p.name, p]));
  const featuredProjects = featured.flatMap((name) => byName.get(name) ?? []);
  const others = degraded
    ? []
    : projects.filter((p) => !featured.includes(p.name) && !caseStudyRepos.includes(p.name));
  return { featured: featuredProjects, others, degraded };
}
