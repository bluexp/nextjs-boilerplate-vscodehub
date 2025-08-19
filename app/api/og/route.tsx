import { ImageResponse } from "@vercel/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * GET /api/og
 * Generate a dynamic OpenGraph image.
 * Query params:
 * - title: string
 * - subtitle: string
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "VSCodeHub — Awesome Catalog";
  const subtitle = searchParams.get("subtitle") || "Curated developer excellence";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%)",
          color: "white",
          padding: 64,
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.5) 100%)",
            }}
          />
          <div style={{ fontSize: 28, fontWeight: 600 }}>VSCodeHub</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.1 }}>{title}</div>
          <div style={{ fontSize: 32, opacity: 0.92 }}>{subtitle}</div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 28, opacity: 0.9 }}>vscodehub.com</div>
          <div style={{ fontSize: 22, opacity: 0.85 }}>#awesome #developer</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}