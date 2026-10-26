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
          color: "#ededf0",
          background:
            "radial-gradient(60% 70% at 25% 35%, rgba(167,139,250,0.55), transparent 70%), radial-gradient(55% 60% at 80% 70%, rgba(34,211,238,0.4), transparent 70%), #07070a",
        }}
      >
        <div style={{ fontSize: 30, color: "#a1a1aa", fontFamily: "monospace" }}>~/maxrecursion.dev</div>
        <div style={{ fontSize: 96, fontWeight: 700, marginTop: 20, letterSpacing: -3 }}>{site.name}</div>
        <div style={{ display: "flex", fontSize: 38, color: "#c4c4cc", marginTop: 16 }}>
          {`${site.role}. ${site.tagline}`}
        </div>
      </div>
    ),
    size,
  );
}
