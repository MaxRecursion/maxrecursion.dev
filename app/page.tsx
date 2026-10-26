import { CaseStudyCard } from "@/components/case-study/CaseStudyCard";
import { Hero } from "@/components/hero/Hero";
import { FeaturedCard } from "@/components/projects/FeaturedCard";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { Reveal } from "@/components/Reveal";
import { Footer, Header, Section } from "@/components/sections";
import { caseStudies } from "@/content/case-studies";
import { site } from "@/content/site";
import { getProjectFeed } from "@/lib/github";

export default async function Home() {
  const { featured, others } = await getProjectFeed();
  // An odd last card spans the row instead of sitting alone beside a gap.
  const oddCount = featured.length % 2 === 1;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    alternateName: site.handle,
    url: site.url,
    jobTitle: site.role,
    address: { "@type": "PostalAddress", addressLocality: "Pune", addressCountry: "IN" },
    sameAs: [site.links.github, site.links.linkedin],
    knowsAbout: site.skills,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Header />
      <main id="main">
        <Hero />

        <Section id="projects" eyebrow="Selected work" title="Projects">
          <div className="grid gap-6 md:grid-cols-2">
            {featured.map((p, i) => {
              const wide = oddCount && i === featured.length - 1;
              return (
                <Reveal key={p.name} delay={(i % 2) * 0.08} className={wide ? "md:col-span-2" : ""}>
                  <FeaturedCard project={p} wide={wide} />
                </Reveal>
              );
            })}
          </div>
        </Section>

        <Section id="case-studies" eyebrow="Engineering write-ups" title="Case studies">
          <p className="-mt-4 mb-8 max-w-2xl text-muted">
            Two projects written up with their constraints, decisions and trade-offs, and with what the
            evidence does and does not show.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            {caseStudies.map((study, i) => (
              <Reveal key={study.slug} delay={i * 0.08}>
                <CaseStudyCard study={study} />
              </Reveal>
            ))}
          </div>
        </Section>

        {others.length > 0 && (
          <Section id="repositories" eyebrow="Repositories" title="Everything else on GitHub">
            <ProjectGrid projects={others} />
            <p className="mt-6 text-sm text-muted">
              Refreshed hourly from GitHub, newest push first.{" "}
              <a
                href={site.links.github}
                target="_blank"
                rel="noreferrer noopener"
                className="rounded text-accent underline decoration-accent/50 underline-offset-4 hover:decoration-accent"
              >
                All repositories on GitHub
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </p>
          </Section>
        )}

        <Section id="about" eyebrow="About" title="Hi, I'm Akshay.">
          <div className="grid gap-12 md:grid-cols-[3fr_2fr]">
            <div className="space-y-4 text-lg leading-relaxed text-muted">
              {site.bio.map((para) => (
                <p key={para.slice(0, 24)}>{para}</p>
              ))}
            </div>
            <div className="space-y-10">
              <div>
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                  As a <span className="normal-case tracking-normal">CorpoRat-developer</span>
                </h3>
                <ol className="mt-4 space-y-3">
                  {site.experience.map((job) => (
                    <li key={job.period} className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
                      <p className="font-medium">{job.role}</p>
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
