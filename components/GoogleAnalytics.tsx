"use client";

import Script from "next/script";
import { useEffect } from "react";
import { GA_MEASUREMENT_ID, trackEvent, type AnalyticsEvent } from "@/lib/analytics";

// Analytics storage is off by default for visitors in the EEA, the UK and Switzerland, where it needs
// consent the site does not ask for; Google then receives cookieless pings only. Ads storage is off for
// everyone, since the site runs no ads. Google decides the region, so no geolocation runs here.
const CONSENT_REGIONS = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU",
  "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO", "GB", "CH",
];

const init = (id: string) => `
window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "granted" });
gtag("consent", "default", { analytics_storage: "denied", region: ${JSON.stringify(CONSENT_REGIONS)} });
gtag("js", new Date());
gtag("config", ${JSON.stringify(id)}, { allow_google_signals: false, allow_ad_personalization_signals: false });
`;

/** Sends the event named by the nearest [data-analytics] ancestor of a click; see trackClick(). */
function onClick(e: MouseEvent) {
  if (e.type === "auxclick" && e.button !== 1) return;
  const raw = e.target instanceof Element ? e.target.closest("[data-analytics]")?.getAttribute("data-analytics") : null;
  if (!raw) return;
  try {
    trackEvent(JSON.parse(raw) as AnalyticsEvent);
  } catch {
    // A malformed attribute is a bug to fix in markup, not a reason to break the click.
  }
}

/**
 * Loads the Google tag and listens for marked clicks. Rendered once, in the root layout; renders nothing
 * when NEXT_PUBLIC_GA_MEASUREMENT_ID is unset.
 */
export function GoogleAnalytics() {
  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;
    // Capture phase, so one listener sees every marked click whatever the page's own handlers do.
    // auxclick covers middle-clicks, which open links in a new tab without firing click.
    document.addEventListener("click", onClick, true);
    document.addEventListener("auxclick", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("auxclick", onClick, true);
    };
  }, []);

  if (!GA_MEASUREMENT_ID) return null;
  return (
    <>
      <Script id="ga-init" strategy="afterInteractive">
        {init(GA_MEASUREMENT_ID)}
      </Script>
      <Script
        id="ga-gtag"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
    </>
  );
}
