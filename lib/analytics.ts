// Google Analytics 4 custom events. Vercel Web Analytics counts page views on its own (its custom events
// need Pro), so GA4 is only here for the clicks. GA4 page views are not sent from this file: the Google tag
// sends one on load, and Enhanced Measurement sends one per client-side navigation.

/** Undefined unless NEXT_PUBLIC_GA_MEASUREMENT_ID is set to a well-formed ID; GA4 is then off entirely. */
export const GA_MEASUREMENT_ID = (() => {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  return id && /^G-[A-Z0-9]+$/.test(id) ? id : undefined;
})();

export type ProjectDestination = "live_demo" | "download" | "github" | "project_details";

// Parameters carry fixed labels and repository names only, never anything typed or personal.
// resume_download and contact_click are part of the contract, but the site has no résumé or contact
// element yet; LinkedIn and GitHub profile links are counted as social_click.
export type AnalyticsEvent =
  | { name: "project_click"; params: { project_name: string; destination: ProjectDestination } }
  | { name: "social_click"; params: { platform: "github" | "linkedin" } }
  | { name: "contact_click"; params: { method: "email" | "linkedin" } }
  | { name: "resume_download"; params: { file_name: string } };

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(event: AnalyticsEvent) {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined" || typeof window.gtag !== "function") return;
  try {
    window.gtag("event", event.name, event.params);
  } catch {
    // Analytics must never get in the way of the click it is measuring.
  }
}

/**
 * Marks an existing link for the single click listener in <GoogleAnalytics />. Spread it onto the element;
 * it works in Server Components and adds nothing when GA4 is off.
 */
export function trackClick(event: AnalyticsEvent): { "data-analytics"?: string } {
  return GA_MEASUREMENT_ID ? { "data-analytics": JSON.stringify(event) } : {};
}
