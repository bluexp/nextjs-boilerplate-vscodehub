export const runtime = "edge";

import { getStoredEtag, persistCatalog, storeEtag, getCatalog } from "@/lib/kv";
import { parseAwesomeList } from "@/lib/parser";
import { getEnv } from "@/lib/utils";
import type { AwesomeCatalog } from "@/types";

/**
 * Verify the Cron secret from request headers.
 * Supports two auth schemes:
 * 1) x-cron-secret: <CRON_SECRET> (for Settings → Cron Jobs with custom header)
 * 2) Authorization: Bearer <CRON_SECRET> (for vercel.json crons)
 *
 * Dev convenience: In non-production (NODE_ENV !== 'production'),
 * we bypass auth to make local data seeding smoother.
 * Skip validation only in development; keep strict validation in production.
 *
 * Returns a Response if unauthorized/misconfigured; otherwise returns null to proceed.
 */
async function verifyCronSecret(req: Request): Promise<Response | null> {
  if (process.env.NODE_ENV !== "production") {
    return null; // dev-only bypass
  }
  const secret = getEnv("CRON_SECRET");
  if (!secret) {
    return new Response("Missing CRON_SECRET on server", { status: 500 });
  }
  const headerA = req.headers.get("x-cron-secret");
  const headerB = req.headers.get("authorization");
  const bearer = `Bearer ${secret}`;
  const ok = (headerA && headerA === secret) || (headerB && headerB === bearer);
  if (!ok) {
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}

/**
 * Decode base64 string to UTF-8 using Web APIs (Edge compatible).
 * @param b64 Base64-encoded string from GitHub Contents API
 * @returns Decoded UTF-8 string
 */
function base64ToUtf8(b64: string): string {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/**
 * Fetch the Awesome repo's README.md (main) via GitHub.
 * Prefers the raw GitHub content URL with Authorization to reduce rate limits.
 *
 * When force is true, we will NOT send If-None-Match to bypass 304 and fetch fresh content.
 * This helps recover from cases where ETag exists but catalog was never persisted.
 *
 * @param force Whether to bypass conditional request with ETag and force a fresh fetch
 * @returns The markdown content, source used, etag, and whether the content was modified
 */
async function fetchAwesomeReadme(force = false): Promise<{
  content: string;
  source: string;
  etag: string | null;
  isModified: boolean;
}> {
  const token = getEnv("GITHUB_TOKEN");
  const lastEtag = force ? null : await getStoredEtag();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (lastEtag) headers["If-None-Match"] = lastEtag;
  headers["User-Agent"] = "vscodehub-sync-bot";

  // Try the raw content URL first
  const rawUrl =
    "https://raw.githubusercontent.com/sindresorhus/awesome/main/readme.md";
  const rawRes = await fetch(rawUrl, { headers });

  const etag = rawRes.headers.get("etag");
  if (rawRes.status === 304) {
    return { content: "", source: "raw", etag, isModified: false };
  }

  if (rawRes.ok) {
    const md = await rawRes.text();
    return { content: md, source: "raw", etag, isModified: true };
  }

  // Fallback to GitHub Contents API
  const apiUrl =
    "https://api.github.com/repos/sindresorhus/awesome/contents/readme.md?ref=main";
  const apiRes = await fetch(apiUrl, { headers });

  const apiEtag = apiRes.headers.get("etag");
  if (apiRes.status === 304) {
    return { content: "", source: "api", etag: apiEtag, isModified: false };
  }

  if (!apiRes.ok) {
    const text = await apiRes.text().catch(() => "");
    throw new Error(`GitHub fetch failed: ${apiRes.status} ${apiRes.statusText} ${text}`);
  }
  const json = (await apiRes.json()) as { content?: string; encoding?: string };
  if (!json.content || json.encoding !== "base64") {
    throw new Error("Unexpected GitHub API response shape for README content.");
  }
  const decoded = base64ToUtf8(json.content);
  return { content: decoded, source: "api", etag: apiEtag, isModified: true };
}

/**
 * Cron entry: Pull latest content from GitHub, parse it, and store to KV.
 *
 * Supports an optional query string `?force=1` (or header `x-force-sync: 1`) to bypass ETag and
 * force a fresh fetch+persist. This is useful when the ETag exists but the catalog key is missing.
 *
 * @param req Incoming Request to the sync endpoint
 * @returns JSON Response indicating whether data was stored
 */
export async function POST(req: Request) {
  const guard = await verifyCronSecret(req);
  if (guard) return guard;

  try {
    // Force flag via query or header
    const url = new URL(req.url);
    const forceQS = url.searchParams.get("force");
    const forceHeader = req.headers.get("x-force-sync");
    const force = forceQS === "1" || forceQS === "true" || forceHeader === "1" || forceHeader === "true";

    // 1. Fetch
    let { content, source, etag, isModified } = await fetchAwesomeReadme(force);

    // If not modified, but catalog is missing, do a one-time forced fetch to heal state
    if (!isModified) {
      const existing = await getCatalog();
      if (!existing) {
        ({ content, source, etag, isModified } = await fetchAwesomeReadme(true));
      }
    }

    if (!isModified) {
      return new Response(
        JSON.stringify({ ok: true, source, stored: false, message: "Not modified" }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }

    // 2. Parse
    const catalog = await parseAwesomeList(content);

    // 3. Persist
    await persistCatalog(catalog);
    if (etag) {
      await storeEtag(etag);
    }

    const { meta } = catalog;
    return new Response(
      JSON.stringify({
        ok: true,
        source,
        stored: true,
        meta,
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

/**
 * Optional GET for manual triggering or vercel.json crons (uses Authorization header).
 * Mirrors POST behavior, including support for `?force=1`.
 *
 * @param req Incoming Request
 * @returns Same as POST()
 */
export async function GET(req: Request) {
  return POST(req);
}