import { getCatalog } from "@/lib/kv";
import { NextResponse } from "next/server";

export const runtime = "edge";

/**
 * API route to fetch the entire awesome catalog.
 */
export async function GET() {
  try {
    const catalog = await getCatalog();
    if (!catalog) {
      return NextResponse.json(
        { ok: false, error: "Catalog not found. Run sync first." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, data: catalog });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: `Failed to fetch catalog: ${message}` },
      { status: 500 }
    );
  }
}