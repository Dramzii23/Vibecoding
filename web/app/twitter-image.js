import { ImageResponse } from "next/og"
import config from "@/config"

export const runtime = "edge"
export const alt = config.app.name
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#0B1220",
          backgroundImage: `radial-gradient(circle at 78% 22%, ${config.brand.primary}55, transparent 55%)`,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "48px",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              backgroundColor: config.brand.primary,
            }}
          />
          <div style={{ display: "flex", fontSize: "32px", color: "#94A3B8" }}>
            {config.app.domain}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "76px",
            fontWeight: 700,
            color: "#F8FAFC",
            lineHeight: 1.1,
            maxWidth: "980px",
          }}
        >
          {config.app.name}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "34px",
            color: "#CBD5E1",
            marginTop: "28px",
            maxWidth: "900px",
            lineHeight: 1.4,
          }}
        >
          {config.app.description}
        </div>
      </div>
    ),
    { ...size }
  )
}
