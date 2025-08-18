import { getCatalog } from "@/lib/kv";
import { searchItems } from "@/lib/parser";
import { NextResponse } from "next/server";

export const runtime = "edge";

/**
 * API route to search items in the catalog.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = Number(searchParams.get("limit")) || 20;

    if (!query?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Search query is required" },
        { status: 400 }
      );
    }

    const catalog = await getCatalog();
    if (!catalog) {
      return NextResponse.json(
        { ok: false, error: "Catalog not found. Run sync first." },
        { status: 404 }
      );
    }

    const results = searchItems(catalog, query, limit);
    return NextResponse.json({
      ok: true,
      data: {
        query,
        limit,
        total: results.length,
        items: results,
      },
    });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: `Search failed: ${message}` },
      { status: 500 }
    );
  }
}