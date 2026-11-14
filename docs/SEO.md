# SEO plan for maxrecursion.dev

Target searches: **Akshay Kulkarni**, **MaxRecursion**, **Blazor**, **AutoVerse**, **SIP planner**.

## What the code does

| Search | Page built for it | Notes |
|---|---|---|
| MaxRecursion | `/` (WebSite name, Person `alternateName`, every title) | Unique brand; should rank first once indexed. |
| Akshay Kulkarni | `/`: Person JSON-LD with `sameAs` GitHub and LinkedIn, city, `disambiguatingDescription` | Very common name; see the off-site steps. |
| Blazor | `/blazor`, `/case-studies/f1-analyst` | Aimed at "Blazor WebAssembly" + DuckDB / performance / Web Worker. |
| AutoVerse | `/projects/autoverse` → `autoverse.maxrecursion.dev` | The live app is the page that should rank; this page backs it up. |
| SIP planner | `/projects/tithi-sip-planner` → `tithi.maxrecursion.dev` | Same: the per-fund pages on the Tithi site are the strongest asset. |

Every page has a unique title (keywords first, about 60 characters), a description of 155 characters or fewer,
a canonical URL, its own Open Graph and Twitter card, and JSON-LD. All of them are in `sitemap.xml` and linked from
the footer of every page. Use `pageMetadata()` in `lib/seo.ts` for any new page.

## What only the site owner can do (in order of impact)

1. **Google Search Console**
   - Add a **Domain property** for `maxrecursion.dev` (DNS TXT record). It covers the apex domain, `www` and every
     subdomain in one place. The existing tag only verifies the `https://maxrecursion.dev` URL prefix.
   - Submit `https://maxrecursion.dev/sitemap.xml`.
   - URL Inspection → **Request indexing** for `/`, `/blazor`, `/projects`, `/projects/autoverse`,
     `/projects/tithi-sip-planner` and the two case studies.
   - Submit each app's own sitemap (autoverse, tithi, unseen, archeo) if it has one.
2. **Redirect `www` to the apex.** In Vercel → Domains, set `www.maxrecursion.dev` to *Redirect to
   maxrecursion.dev* (308/301). Every canonical points at the apex.
3. **Bing Webmaster Tools.** Import from Search Console. Bing also feeds DuckDuckGo, Yahoo and ChatGPT search.
4. **Links that tell Google who "Akshay Kulkarni (MaxRecursion)" is.** Name searches are won by consistent
   profiles that all link to each other:
   - GitHub profile: set *Website* to `https://maxrecursion.dev` and add a profile README linking to it.
   - Each repo's *About → Website*: the live app, and the app's footer linking back to `maxrecursion.dev`.
   - LinkedIn: *Contact info → Website* and a *Featured* link to `maxrecursion.dev`. Use the same name and photo.
   - Optional, each a strong profile result: dev.to / Hashnode (cross-post the case studies with
     `rel=canonical` pointing here), Stack Overflow, X, Mastodon. Add every profile to `site.links` so it
     joins the Person `sameAs` list.
5. **The app subdomains** (separate repos). Give each its own descriptive `<title>` and meta description, a
   canonical, a footer link "by Akshay Kulkarni" → `https://maxrecursion.dev/projects/<slug>`, and
   SoftwareApplication JSON-LD. For Tithi, make sure each per-fund page's title contains "SIP" and the fund name
   (for example "Best SIP date for <fund> | Tithi SIP planner"); those long-tail pages are the realistic way into
   "SIP planner" searches.
6. **Get mentioned where the audience is.** Blazor: r/Blazor, r/dotnet, the Blazor community newsletters, and the
   DuckDB community. SIP planner: r/IndiaInvestments, r/mutualfunds. AutoVerse: r/cars, r/MechanicAdvice, Product
   Hunt, teacher and learner communities. Each genuine link from a relevant site moves rankings more than any
   on-page change.
7. **Keep publishing.** A new case study every month or two, especially on Blazor, builds the topical authority
   that a single page cannot.

## Realistic expectations

- **MaxRecursion**: first page within days to weeks of indexing.
- **Akshay Kulkarni**: shared by many people, including ones with long-established profiles. Page one is
  achievable with the profile links above, but the top spot is not guaranteed. "Akshay Kulkarni Pune",
  "Akshay Kulkarni Blazor" and "Akshay Kulkarni software engineer" are far easier.
- **AutoVerse**: other products share the name. The app plus backlinks can reach page one for "AutoVerse how cars
  work" and similar searches sooner than for the bare word.
- **Blazor** (bare word): owned by Microsoft's docs, Wikipedia and long-established sites. No personal site ranks
  on page one for it. Target "Blazor WebAssembly DuckDB", "Blazor WebAssembly performance", "Blazor Web Worker".
- **SIP planner**: dominated by large finance portals and AMCs. Target "best SIP date", "does SIP date matter",
  "SIP date <fund name>".

Check progress in Search Console → Performance → Queries, filtered by these terms.
