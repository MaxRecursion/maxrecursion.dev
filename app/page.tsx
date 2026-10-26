import { Hero } from "@/components/hero/Hero";
import { FeaturedCard } from "@/components/projects/FeaturedCard";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { Reveal } from "@/components/Reveal";
import { Footer, Header, Section } from "@/components/sections";
import { featured } from "@/content/projects";
import { site } from "@/content/site";
import { getProjects, languagesOf } from "@/lib/github";

export default async function Home() {
  const projects = await getProjects();
  const featuredProjects = featured
    .map((name) => projects.find((p) => p.name === name))
    .filter((p) => p !== undefined);
  const others = projects.filter((p) => !p.featured);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    alternateName: site.handle,
    url: site.url,
    jobTitle: site.role,
    address: { "@type": "PostalAddress", addressLocality: "Pune", addressCountry: "IN" },
    sameAs: [site.links.github, site.links.linkedin],
    worksFor: { "@type": "Organization", name: site.experience[0].company },
    knowsAbout: site.skills,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Header />
      <main id="top">
        <Hero />

        <Section id="projects" eyebrow="Selected work" title="Things I've built">
          <div className="grid gap-6 md:grid-cols-2">
            {featuredProjects.map((p, i) => (
              <Reveal key={p.name} delay={(i % 2) * 0.08}>
                <FeaturedCard project={p} priority={i < 2} />
              </Reveal>
            ))}
          </div>

          <h3 className="mt-20 text-xl font-semibold tracking-tight">Everything else on GitHub</h3>
          <p className="mt-2 text-sm text-muted">
            Pulled live from GitHub, sorted by most recently pushed.
          </p>
          <div className="mt-6">
            <ProjectGrid projects={others} languages={languagesOf(others)} />
          </div>
        </Section>

        <Section id="about" eyebrow="About" title="Hi, I'm Akshay.">
          <div className="grid gap-12 md:grid-cols-[3fr_2fr]">
            <div className="space-y-4 text-lg leading-relaxed text-muted">
              {site.bio.map((para) => (
                <p key={para.slice(0, 24)}>{para}</p>
              ))}
            </div>
            <div className="space-y-10">
              <div>
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Where I&apos;ve worked</h3>
                <ol className="mt-4 space-y-3">
                  {site.experience.map((job) => (
                    <li key={job.company} className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
                      <div>
                        <p className="font-medium">{job.company}</p>
                        <p className="text-sm text-muted">{job.role}</p>
                      </div>
                      <span className="shrink-0 font-mono text-xs text-muted">{job.period}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Toolbox</h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {site.skills.map((skill) => (
                    <li key={skill} className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm">
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
