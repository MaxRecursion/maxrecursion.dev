# Analytics setup

Three services, each independent of the others:

| Service | What it measures | Where it lives in code | Needs dashboard setup |
| --- | --- | --- | --- |
| Vercel Web Analytics | Page views, visitors, referrers, countries, browsers, devices. Cookieless. | `<Analytics />` in `app/layout.tsx` | Yes, enable per project |
| Vercel Speed Insights | Real-user performance | `<SpeedInsights />` in `app/layout.tsx` | Yes, enable per project |
| Google Analytics 4 | Custom click events, plus its own page views | `components/GoogleAnalytics.tsx`, `lib/analytics.ts` | Yes, a property, a web stream and an env var |

Each is mounted once, in the root layout. GA4 is the only one that needs configuration in code, and it stays off until `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set.

> This is a Next.js app, so the variable is `NEXT_PUBLIC_GA_MEASUREMENT_ID`. A `VITE_` variable would never reach the browser here.

## Plan limits (Hobby)

- **Web Analytics:** 50,000 events a month across all projects on the account, with a one-month reporting window. Collection pauses once the limit is reached; you are never charged. Vercel custom events (`track()`) are Pro-only, which is why the click events go to GA4.
- **Speed Insights:** free on every plan, with 10,000 events over a rolling 30 days shared across the team. The free tier shows the Real Experience Score with path and route breakdowns. Per-metric Core Web Vitals (LCP, INP, CLS, FCP, TTFB) need Speed Insights Plus, a paid add-on for Pro. The package still collects them; the dashboard just doesn't show them on the free tier.
- **GA4:** free.

## Custom events (GA4)

| Event | Parameters | Sent from |
| --- | --- | --- |
| `project_click` | `project_name`: the GitHub repo name (stable even if a title changes, for example `ActiveAero_F1` for UNSEEN). `destination`: `live_demo`, `download`, `github` or `project_details` | Featured cards (Live demo, Download, Source), the "Everything else" grid, case-study cards and the Source and evidence links on case-study pages |
| `social_click` | `platform`: `github` or `linkedin` | Hero icons, footer icons, "All repositories on GitHub" |
| `contact_click` | `method` | Defined, not used: the site has no email link or contact form |
| `resume_download` | `file_name` | Defined, not used: the site has no résumé file |

To track a new link, spread `trackClick(...)` onto it. It's typed, works in Server Components, and adds nothing when GA4 is off:

```tsx
<a href="/resume.pdf" download {...trackClick({ name: "resume_download", params: { file_name: "resume.pdf" } })}>
```

One capture-phase listener in `components/GoogleAnalytics.tsx` reads the attribute, so each click sends one event whatever other handlers the link has. Event parameters carry only repo names and fixed labels.

**Page views.** The Google tag sends the first page view on load. GA4 Enhanced Measurement ("page changes based on browser history events") sends one for each client-side navigation, such as opening a case study. No code sends page views by hand, so nothing is counted twice.

**Duplicates with Enhanced Measurement.** "Outbound clicks" sends a generic `click` event for every external link. That covers the same clicks as `project_click` and `social_click`, under a different event name. Turn it off (see step 3 below) so reports are not double-counted. "File downloads" can stay on: no link on the site points at a file it recognises. If a résumé PDF is added later, it will also produce a `file_download` event, so report on `resume_download`.

## Privacy and consent

- Visitors in the EEA, the UK and Switzerland start with `analytics_storage` denied. GA4 sets no cookies for them and receives only cookieless pings, which Google uses for modelling. Everyone else gets normal GA4 measurement. Ads storage, ad personalisation and Google signals are off for all visitors. Google applies the region rule; the site runs no geolocation.
- Vercel Web Analytics and Speed Insights use no cookies and need no consent banner.
- Measuring EEA and UK visitors fully in GA4 would need a real consent banner that calls `gtag("consent", "update", { analytics_storage: "granted" })` after the visitor opts in. None is included, so EEA and UK traffic is fully counted only in Vercel Web Analytics.
- India's DPDP Act also has consent rules for personal data, which come into force in phases. Check them again before relying on GA4 for Indian visitors in the long run. This section describes how the code behaves; it is not legal advice.

## Setup

### 1. Create the GA4 property and web stream

1. Go to <https://analytics.google.com/> → **Admin** → **Create** → **Property**. Name it `maxrecursion.dev`, set the reporting time zone to India (GMT+05:30) and the currency to INR.
2. Choose **Web** as the platform, enter `https://maxrecursion.dev` as the URL and `maxrecursion.dev` as the stream name, and keep Enhanced Measurement on.
3. In **Admin → Data streams → (the stream) → Enhanced measurement ⚙**, keep **Page views → Page changes based on browser history events** on, and turn **Outbound clicks** off.

### 2. Get the Measurement ID

**Admin → Data streams → (the stream)**. The ID is in the top right and looks like `G-XXXXXXXXXX`.

### 3. Local configuration (optional)

```bash
cp .env.example .env.local
```

Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in `.env.local` (git ignores it), then restart `pnpm dev`. Leave it unset during normal development so your own visits don't reach the production property.

### 4. Vercel Production variable

In the Vercel project: **Settings → Environment Variables → Add**, with the key `NEXT_PUBLIC_GA_MEASUREMENT_ID`, the ID as its value, and **Production** as the only environment. Leaving it out of Preview and Development keeps test traffic out of the reports.

### 5. Redeploy

`NEXT_PUBLIC_` values are inlined at build time, so after any change to the variable, redeploy. Use **Deployments → (latest production) → ⋯ → Redeploy**, or push a commit.

### 6. Enable Vercel Web Analytics and Speed Insights

In the Vercel project, open **Analytics** and click **Enable**, then open **Speed Insights** and click **Enable**. Both start collecting with the next deployment that includes the components; this code already has them.

## Verify

- **GA4 Realtime:** open the site in a browser without an ad blocker, then **Reports → Realtime**. A visit should appear within a minute or so, and clicks should show under "Event count by Event name".
- **GA4 DebugView:** install the Google Analytics Debugger extension or use Tag Assistant (<https://tagassistant.google.com/>), then open **Admin → DebugView** to see events with their parameters. New custom parameters take up to 24 hours to appear in standard reports. To report on `project_name`, `destination` and `platform`, register each one as an event-scoped custom dimension in **Admin → Custom definitions**.
- **In the browser:** the Network tab shows requests to `google-analytics.com/g/collect` with `en=project_click` and so on, `/_vercel/insights/view` for Web Analytics, and `/_vercel/speed-insights/vitals` for Speed Insights.
- **Vercel dashboards:** Web Analytics shows visitors within minutes of real traffic. Speed Insights needs enough real visits to report a score; a handful of test visits may not be enough.

Ad blockers and privacy browsers block GA4 and sometimes Vercel's scripts too. Test in a clean profile.

## Turning GA4 off

Remove `NEXT_PUBLIC_GA_MEASUREMENT_ID`, or leave it empty, and rebuild. With it off, the Google tag never loads, no `data-analytics` attributes are rendered, and nothing is logged. An ID that doesn't match `G-…` is treated as unset. Vercel Web Analytics and Speed Insights are unaffected.
