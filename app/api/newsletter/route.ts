import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { kvGet, kvSetJSON } from "@/lib/kv";

export const runtime = "edge";

const NEWSLETTER_KEY = "newsletter:subscribers";

/**
 * POST /api/newsletter
 * Minimal newsletter subscription endpoint.
 * Accepts JSON body: { email: string }
 * Stores into KV under a single JSON object keyed by email with timestamp to avoid duplicates.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim() : "";

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    // Load current subscribers map
    type SubsMap = Record<string, { subscribedAt: string }>;
    const existing = (await kvGet<SubsMap>(NEWSLETTER_KEY)) || {};

    if (!existing[email]) {
      existing[email] = { subscribedAt: new Date().toISOString() };
      await kvSetJSON(NEWSLETTER_KEY, existing);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Unknown error" }, { status: 500 });
  }
}