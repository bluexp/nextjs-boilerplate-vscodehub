export const runtime = "edge";

import { parseAwesomeList } from "@/lib/parser";
import type { AwesomeCatalog } from "@/types";

/**
 * Read environment variable safely in Edge runtime using globalThis.
 * Avoids direct reference to Node's `process` symbol for type compatibility.
 */
function getEnv(name: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (globalThis as any)?.process?.env ?? {};
  const value = env[name];
  return typeof value === "string" ? value.trim() : "";
}

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
 * Resolve the best available REST URL and token for Upstash/Vercel KV.
 * Supports both KV_* and UPSTASH_* env variable names.
 */
function resolveKvEnv(): { url: string; token: string } {
  const url = getEnv("KV_REST_API_URL") || getEnv("UPSTASH_REDIS_REST_URL");
  const token = getEnv("KV_REST_API_TOKEN") || getEnv("UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token) {
    throw new Error("KV REST URL or TOKEN is missing. Ensure KV is connected and envs are set.");
  }
  return { url, token };
}

/**
 * Store a plain string value in KV by REST API.
 * This uses Upstash Redis REST protocol: POST body is the value, path is /set/<key>
 */
async function kvSetString(key: string, value: string): Promise<void> {
  const { url, token } = resolveKvEnv();
  const endpoint = `${url.replace(/\/$/, "")}/set/${encodeURIComponent(key)}`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: value,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`KV set failed: ${res.status} ${res.statusText} ${text}`);
  }
}

/**
 * Store a JSON-serializable value in KV by converting it to string first.
 */
async function kvSetJSON(key: string, data: unknown): Promise<void> {
  await kvSetString(key, JSON.stringify(data));
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
 * Persist the parsed catalog and its metadata into KV.
 */
async function persistCatalog(catalog: AwesomeCatalog) {
  const CATALOG_KEY = "awesome:catalog";
  await kvSetJSON(CATALOG_KEY, catalog);
}

/**
 * Fetch the Awesome repo's README.md (main) via GitHub.
 * Prefers the raw GitHub content URL with Authorization to reduce rate limits.
 */
async function fetchAwesomeReadme(): Promise<{ content: string; source: string }> {
  const token = getEnv("GITHUB_TOKEN");
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  headers["User-Agent"] = "vscodehub-sync-bot";

  // Try the raw content URL first
  const rawUrl =
    "https://raw.githubusercontent.com/sindresorhus/awesome/main/readme.md";
  const rawRes = await fetch(rawUrl, { headers });
  if (rawRes.ok) {
    const md = await rawRes.text();
    return { content: md, source: "raw" };
  }

  // Fallback to GitHub Contents API
  const apiUrl =
    "https://api.github.com/repos/sindresorhus/awesome/contents/readme.md?ref=main";
  const apiRes = await fetch(apiUrl, {
    headers: {
      ...headers,
      Accept: "application/vnd.github+json",
    },
  });
  if (!apiRes.ok) {
    const text = await apiRes.text().catch(() => "");
    throw new Error(`GitHub fetch failed: ${apiRes.status} ${apiRes.statusText} ${text}`);
  }
  const json = (await apiRes.json()) as { content?: string; encoding?: string };
  if (!json.content || json.encoding !== "base64") {
    throw new Error("Unexpected GitHub API response shape for README content.");
  }
  const decoded = base64ToUtf8(json.content);
  return { content: decoded, source: "api" };
}

/**
 * Cron entry: Pull latest content from GitHub, parse it, and store to KV.
 */
export async function POST(req: Request) {
  const guard = await verifyCronSecret(req);
  if (guard) return guard;

  try {
    // 1. Fetch
    const { content, source } = await fetchAwesomeReadme();

    // 2. Parse
    const catalog = await parseAwesomeList(content);

    // 3. Persist
    await persistCatalog(catalog);

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