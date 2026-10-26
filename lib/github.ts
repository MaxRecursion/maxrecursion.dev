import { cacheLife, cacheTag } from "next/cache";
import { featured, hidden, overrides } from "@/content/projects";
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
  url: string;
  liveUrl?: string;
  language?: string;
  tags: string[];
  stars: number;
  pushedAt: string;
  featured: boolean;
  image?: string;
};

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
  const topics = repo.topics ?? [];
  return {
    name: repo.name,
    title: o.title ?? repo.name,
    description: o.description ?? repo.description ?? "",
    url: repo.html_url,
    liveUrl: liveUrlFor(repo),
    language: repo.language ?? undefined,
    tags: o.tags ?? topics.slice(0, 4),
    stars: repo.stargazers_count,
    pushedAt: repo.pushed_at,
    featured: featured.includes(repo.name),
    image: o.image,
  };
}

export async function getProjects(): Promise<Project[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("repos");

  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const res = await fetch(
    `https://api.github.com/users/${site.handle}/repos?per_page=100&type=owner&sort=pushed`,
    { headers },
  );
  if (!res.ok) throw new Error(`GitHub API responded ${res.status}`);

  const repos = (await res.json()) as GitHubRepo[];
  return repos
    .filter((r) => !r.fork && !r.archived && !r.private && !hidden.includes(r.name))
    .map(toProject);
}

/** Languages across all shown repos, most used first. */
export function languagesOf(projects: Project[]): string[] {
  const counts = new Map<string, number>();
  for (const p of projects) {
    if (p.language) counts.set(p.language, (counts.get(p.language) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([lang]) => lang);
}
