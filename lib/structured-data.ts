// JSON-LD for search engines and AI crawlers. Every page points at the same Person by @id, so Google can
// connect the site, the case studies and the GitHub and LinkedIn profiles to one entity.
import type { CaseStudy } from "@/content/case-studies";
import { repoBase } from "@/content/case-studies";
import { site } from "@/content/site";

export const personId = `${site.url}/#person`;
export const websiteId = `${site.url}/#website`;

const [givenName, familyName] = site.name.split(" ");

const authorRef = { "@type": "Person", "@id": personId, name: site.name, url: site.url };

export function homeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: site.url,
        // The brand is the site's name; Google reads this for the name shown above the result.
        name: site.handle,
        alternateName: ["maxrecursion.dev", site.name],
        inLanguage: "en",
        publisher: { "@id": personId },
      },
      {
        "@type": "ProfilePage",
        "@id": `${site.url}/#profilepage`,
        url: site.url,
        name: `${site.name} (${site.handle}) | ${site.role}`,
        isPartOf: { "@id": websiteId },
        mainEntity: { "@id": personId },
      },
      {
        "@type": "Person",
        "@id": personId,
        name: site.name,
        givenName,
        familyName,
        alternateName: [site.handle, `${site.name} (${site.handle})`],
        url: site.url,
        description: site.description,
        // Separates this Akshay Kulkarni from the many others with the same name.
        disambiguatingDescription: `${site.role} in Pune, India, who publishes projects and write-ups as ${site.handle} at maxrecursion.dev.`,
        jobTitle: site.role,
        homeLocation: { "@type": "Place", name: site.location },
        address: { "@type": "PostalAddress", addressLocality: "Pune", addressRegion: "Maharashtra", addressCountry: "IN" },
        sameAs: [site.links.github, site.links.linkedin],
        knowsAbout: site.skills,
      },
    ],
  };
}

export function caseStudyJsonLd(study: CaseStudy) {
  const url = `${site.url}/case-studies/${study.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${url}#article`,
        headline: study.title,
        description: study.summary,
        url,
        mainEntityOfPage: url,
        datePublished: study.published,
        inLanguage: "en",
        author: authorRef,
        publisher: authorRef,
        isPartOf: { "@id": websiteId },
        keywords: study.stack.join(", "),
        isBasedOn: `${repoBase}/${study.repo}`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: site.name, item: site.url },
          { "@type": "ListItem", position: 2, name: "Case studies", item: `${site.url}/#case-studies` },
          { "@type": "ListItem", position: 3, name: study.title, item: url },
        ],
      },
    ],
  };
}

/** Serialises JSON-LD for a <script> tag; `<` is escaped so content can never close the tag. */
export const toJsonLd = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");
