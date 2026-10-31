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
| Desert hero, animated sun and homepage art direction | `components/hero/`, `lib/solar-cycle.ts` and `app/home.module.css` |

New public repos appear on their own within an hour. A repo gets a **Live** link from, in order: a `liveUrl` override in `content/projects.ts`, GitHub Pages, or a `homepage` field that points somewhere other than github.com. Archeo, UNSEEN, AutoVerse and Tithi use `liveUrl` overrides and are hosted on Vercel at `archeo.`, `unseen.`, `autoverse.` and `tithi.maxrecursion.dev`, each its own Vercel project connected to its repo.

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

## Design

The homepage uses an original, AI-generated desert landscape with restrained Dune-inspired colors. A masked sky drifts slowly above the still dune contours. Fine spice grains flow over the sand; hovering over the dunes adds a gentle local gust and swirl that settles back into the wind. The grain layer uses a small 2D canvas at a capped 30 frames per second, with fewer particles on phones. Cloud and grain motion pauses offscreen and in hidden tabs, and stays disabled for reduced-motion preferences. Touch scrolling and links remain unobstructed.

A separate sun follows the existing Pune/IST clock: low and warm around dawn and dusk, higher and brighter at midday, and dimmed at night. Light mode shows the sun; dark mode smoothly eclipses it. This is a decorative daily rhythm with a 06:00–18:00 daylight arc, rather than an astronomical sunrise calculation. The clock refreshes every minute and on returning to the tab, with CSS interpolating its position. Reduced-motion preferences disable the gliding and theme transitions.

Geist and Geist Mono, all portfolio content, and project destinations are preserved. Homepage styling is scoped in `app/home.module.css`; case-study pages retain their existing layout. Artwork provenance is in `docs/desert-artwork.md`. Run the clock and gust checks with `node --experimental-strip-types --test lib/solar-cycle.test.ts lib/spice-wind.test.ts`.

Reference direction: [Evan Reiser](https://www.evanreiser.com). Reference review and motion scoping followed the [Reanimate skill](https://github.com/NiazMorshed2007/reanimate/blob/main/skills/reanimate/SKILL.md).
