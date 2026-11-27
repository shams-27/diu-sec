import { ImageResponse } from "next/og";

export const alt = "DIU SEC — Software Engineering Club";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ImageResponse cannot resolve CSS variables, so these are the design-system hex tokens.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FEF2F2",
          color: "#7F1D1D",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 28, height: 28, background: "#B91C1C" }} />
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 4 }}>DAFFODIL INTERNATIONAL UNIVERSITY</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 150, fontWeight: 900, letterSpacing: -4, lineHeight: 1 }}>DIU SEC</div>
          <div style={{ fontSize: 42, color: "#475569", marginTop: 18 }}>Software Engineering Club</div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "8px solid #B91C1C",
            paddingTop: 28,
          }}
        >
          <div style={{ fontSize: 40, fontWeight: 700 }}>Build. Compete. Belong.</div>
          <div style={{ fontSize: 24, color: "#475569" }}>diu.edu.bd</div>
        </div>
      </div>
    ),
    size,
  );
}
