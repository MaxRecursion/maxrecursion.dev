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
| Name, bio, links, experience, skills | `content/site.ts` |
| Featured order, hidden repos, per-repo copy and screenshots | `content/projects.ts` |
| Screenshots for featured cards | `public/projects/` |
| GitHub fetch (cached for an hour with `'use cache'` + `cacheLife('hours')`) | `lib/github.ts` |
| Hero fluid simulation (WebGL2) | `components/hero/fluid/` |

New public repos appear on their own within an hour. A repo gets a **Live** link when GitHub Pages is on, or when its `homepage` field points somewhere other than github.com.

## Deploy

1. Push this folder to a GitHub repo (for example `MaxRecursion/maxrecursion.dev`).
2. In Vercel, **Add New → Project** and import the repo. The framework is detected automatically.
3. Optional: add the environment variable `GITHUB_TOKEN`, a fine-grained token with read-only access to public repositories. It raises the GitHub API rate limit for builds.
4. **Settings → Domains**: add `maxrecursion.dev`, and add `www.maxrecursion.dev` with a redirect to the apex.
5. At your domain registrar, create the DNS records Vercel shows (an `A` record for the apex and a `CNAME` for `www`), or switch the nameservers to Vercel.
6. `.dev` domains only work over HTTPS (HSTS preload). Vercel issues the certificate automatically once DNS resolves.

Then turn on **Analytics** and **Speed Insights** in the Vercel project; the components are already in `app/layout.tsx`.

## Credits

The fluid solver follows Jos Stam's *Stable Fluids* and the approach popularised by Pavel Dobryakov's WebGL-Fluid-Simulation.
