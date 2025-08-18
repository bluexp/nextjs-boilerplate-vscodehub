export const runtime = "edge";

import { getStoredEtag, persistCatalog, storeEtag } from "@/lib/kv";
import { parseAwesomeList } from "@/lib/parser";
import { getEnv } from "@/lib/utils";
import type { AwesomeCatalog } from "@/types";

/**
 * Verify the Cron secret from request headers.
 * Supports two auth schemes:
 * 1) x-cron-secret: <CRON_SECRET> (for Settings → Cron Jobs with custom header)
 * 2) Authorization: Bearer <CRON_SECRET> (for vercel.json crons)
 * Returns a Response if unauthorized/misconfigured; otherwise returns null to proceed.
 */
async function verifyCronSecret(req: Request): Promise<Response | null> {
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
 */
async function fetchAwesomeReadme(): Promise<{
  content: string;
  source: string;
  etag: string | null;
  isModified: boolean;
}> {
  const token = getEnv("GITHUB_TOKEN");
  const lastEtag = await getStoredEtag();
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
 */
export async function POST(req: Request) {
  const guard = await verifyCronSecret(req);
  if (guard) return guard;

  try {
    // 1. Fetch
    const { content, source, etag, isModified } = await fetchAwesomeReadme();

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
 */
export async function GET(req: Request) {
  return POST(req);
}