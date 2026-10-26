import { ImageResponse } from "next/og";
import { site } from "@/content/site";

export const alt = `${site.name}, ${site.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          color: "#ede8dc",
          background:
            "radial-gradient(60% 70% at 25% 35%, rgba(203,160,82,0.42), transparent 70%), radial-gradient(55% 60% at 80% 70%, rgba(143,165,143,0.3), transparent 70%), #0d0e0c",
        }}
      >
        <div style={{ fontSize: 30, color: "#a8a294", fontFamily: "monospace" }}>~/maxrecursion.dev</div>
        <div style={{ fontSize: 96, fontWeight: 700, marginTop: 20, letterSpacing: -3 }}>{site.name}</div>
        <div style={{ display: "flex", fontSize: 40, color: "#ede8dc", marginTop: 20 }}>{site.headline}</div>
        <div style={{ display: "flex", fontSize: 30, color: "#a8a294", marginTop: 16, maxWidth: 980 }}>
          {site.summary}
        </div>
      </div>
    ),
    size,
  );
}
