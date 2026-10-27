# maxrecursion.dev

Personal site of Akshay Kulkarni (MaxRecursion). Next.js 16 (App Router, Cache Components), Tailwind v4, deployed on Vercel.

## Develop

```bash
pnpm install
pnpm dev
```

## Where things live

| What | File |
| --- | --- |
| Name, headline, summary, bio, links, experience, skills | `content/site.ts` |
| Featured order, hidden repos, per-repo copy, tags, screenshots, live links | `content/projects.ts` |
| Case studies (one file each, plus shared types) | `content/case-studies/` and `app/case-studies/<slug>/` |
| Screenshots for featured cards | `public/projects/` |
| GitHub fetch and its failure handling | `lib/github.ts` |
| Hero fluid simulation (WebGL2) | `components/hero/fluid/` |

New public repos appear on their own within an hour. A repo gets a **Live** link from, in order: a `liveUrl` override in `content/projects.ts`, GitHub Pages, or a `homepage` field that points somewhere other than github.com. UNSEEN, AutoVerse and Tithi use `liveUrl` overrides and are hosted on Vercel at `unseen.`, `autoverse.` and `tithi.maxrecursion.dev`, each its own Vercel project connected to its repo.

**If GitHub is unreachable** (rate limit, outage), the build and the page still succeed: the featured projects render from `content/projects.ts`, the "Everything else" list is hidden, and the fetch is retried after five minutes instead of an hour. Set `GITHUB_TOKEN` to avoid rate limits.

**Adding a case study:** add `content/case-studies/<slug>.ts` (see `types.ts` for the shape), register it in `content/case-studies/index.ts`, add the repo name to `caseStudyRepos` in `content/projects.ts`, and copy one of the two small `app/case-studies/<slug>/` folders (`page.tsx` and `opengraph-image.tsx`). Every figure in a case study should be traceable to the repository, and the page should say whether it was measured by the repo's author or for the write-up.

## Deploy

1. Push this folder to a GitHub repo (for example `MaxRecursion/maxrecursion.dev`).
2. In Vercel, **Add New → Project** and import the repo. The framework is detected automatically.
3. Optional: add the environment variable `GITHUB_TOKEN`, a fine-grained token with read-only access to public repositories. It raises the GitHub API rate limit for builds.
4. **Settings → Domains**: add `maxrecursion.dev`, and add `www.maxrecursion.dev` with a redirect to the apex.
5. At your domain registrar, create the DNS records Vercel shows (an `A` record for the apex and a `CNAME` for `www`), or switch the nameservers to Vercel.
6. `.dev` domains only work over HTTPS (HSTS preload). Vercel issues the certificate automatically once DNS resolves.

Then turn on **Analytics** and **Speed Insights** in the Vercel project; the components are already in `app/layout.tsx`. Google Analytics 4 click events are off until `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set; see [ANALYTICS_SETUP.md](ANALYTICS_SETUP.md).

## Credits

The fluid solver follows Jos Stam's *Stable Fluids* and the approach popularised by Pavel Dobryakov's WebGL-Fluid-Simulation.
