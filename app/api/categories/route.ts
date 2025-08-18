import { getCatalog } from "@/lib/kv";
import { NextResponse } from "next/server";

export const runtime = "edge";

/**
 * API route to fetch a list of all categories and subcategories.
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

    const categories = Object.values(catalog.categories).map((cat) => ({
      title: cat.title,
      subcategories: Object.keys(cat.subcategories || {}),
    }));

    return NextResponse.json({ ok: true, data: categories });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: `Failed to fetch categories: ${message}` },
      { status: 500 }
    );
  }
}