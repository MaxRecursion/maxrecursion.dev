import { caseStudies } from "@/content/case-studies";
import { featured, overrides } from "@/content/projects";
import { site } from "@/content/site";

// A plain-markdown summary for AI agents and LLM crawlers (https://llmstxt.org). Built from the same
// content files as the page, so it never drifts from what the site says.
export function GET() {
  const projects = featured.map((repo) => {
    const o = overrides[repo] ?? {};
    // Apps hosted on a maxrecursion.dev subdomain publish their own, more detailed llms.txt.
    const ownLlms = o.liveUrl?.endsWith(".maxrecursion.dev") && `[llms.txt](${o.liveUrl}/llms.txt)`;
    const links = [o.liveUrl && `[${o.liveLabel ?? "Live"}](${o.liveUrl})`, `[Source](${site.links.github}/${repo})`, o.technicalUrl && `[Technical notes](${o.technicalUrl})`, ownLlms]
      .filter(Boolean)
      .join(" · ");
    return `- **${o.title ?? repo}**: ${o.description ?? ""} ${links}`;
  });

  const body = `# ${site.name}

> ${site.description}

${site.name} (also known as ${site.handle}) is a ${site.role.toLowerCase()} based in ${site.location}. ${site.summary}

${site.bio.join("\n\n")}

## Profiles

- [Website](${site.url})
- [GitHub](${site.links.github})
- [LinkedIn](${site.links.linkedin})

## Projects

${projects.join("\n")}

## Case studies

${caseStudies.map((s) => `- [${s.title}](${site.url}/case-studies/${s.slug}): ${s.summary}`).join("\n")}

## Skills

${site.skills.join(", ")}
`;

  return new Response(body, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
