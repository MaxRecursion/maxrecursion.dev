import { ImageResponse } from "next/og";
import { site } from "@/content/site";

/** The social card for a case-study page: its real title on the site's ink-and-gold background. */
export function caseStudyCard({ kicker, title }: { kicker: string; title: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          color: "#ede8dc",
          background:
            "radial-gradient(60% 70% at 20% 30%, rgba(203,160,82,0.38), transparent 70%), radial-gradient(55% 60% at 85% 80%, rgba(143,165,143,0.26), transparent 70%), #0d0e0c",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, color: "#cba052", letterSpacing: 4, textTransform: "uppercase" }}>
          {`Case study · ${kicker}`}
        </div>
        <div style={{ display: "flex", fontSize: 68, fontWeight: 700, lineHeight: 1.1, letterSpacing: -2, maxWidth: 1040 }}>
          {title}
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#a8a294" }}>{`${site.name} · maxrecursion.dev`}</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
