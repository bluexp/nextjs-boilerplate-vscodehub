import { getEnv } from "@/lib/utils";
import type { AwesomeCatalog } from "@/types";

const CATALOG_KEY = "awesome:catalog";
const ETAG_KEY = "awesome:etag";

/**
 * Resolve the best available REST URL and token for Upstash/Vercel KV.
 * Supports both KV_* and UPSTASH_* env variable names.
 */
function resolveKvEnv(): { url: string; token: string } {
  const url = getEnv("KV_REST_API_URL") || getEnv("UPSTASH_REDIS_REST_URL");
  const token = getEnv("KV_REST_API_TOKEN") || getEnv("UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token) {
    throw new Error(
      "KV REST URL or TOKEN is missing. Ensure KV is connected and envs are set."
    );
  }
  return { url, token };
}

/**
 * Generic fetch wrapper for the KV REST API
 */
async function kvFetch(path: string, options: RequestInit = {}) {
  const { url, token } = resolveKvEnv();
  const endpoint = `${url.replace(/\/$/, "")}${path}`;

  const res = await fetch(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store", // Always fetch the latest from KV
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`KV fetch failed: ${res.status} ${res.statusText} ${text}`);
  }
  return res;
}

/**
 * Get a value from KV by REST API.
 * This uses Upstash Redis REST protocol: GET /get/<key>
 */
async function kvGet<T>(key: string): Promise<T | null> {
  const res = await kvFetch(`/get/${encodeURIComponent(key)}`);
  const json = await res.json();
  if (json.result) {
    return JSON.parse(json.result) as T;
  }
  return null;
}

/**
 * Get a string value from KV.
 */
async function kvGetString(key: string): Promise<string | null> {
  const res = await kvFetch(`/get/${encodeURIComponent(key)}`);
  const json = await res.json();
  return json.result || null;
}

/**
 * Store a plain string value in KV by REST API.
 * This uses Upstash Redis REST protocol: POST body is the value, path is /set/<key>
 */
async function kvSetString(key: string, value: string): Promise<void> {
  await kvFetch(`/set/${encodeURIComponent(key)}`, {
    method: "POST",
    body: value,
  });
}

/**
 * Store a JSON-serializable value in KV by converting it to string first.
 */
async function kvSetJSON(key: string, data: unknown): Promise<void> {
  await kvSetString(key, JSON.stringify(data));
}

/**
 * Fetches the full awesome catalog from the KV store.
 */
export async function getCatalog(): Promise<AwesomeCatalog | null> {
  return kvGet<AwesomeCatalog>(CATALOG_KEY);
}

/**
 * Persist the parsed catalog and its metadata into KV.
 */
export async function persistCatalog(catalog: AwesomeCatalog) {
  await kvSetJSON(CATALOG_KEY, catalog);
}

/**
 * Get the last known ETag for the awesome list from KV.
 */
export async function getStoredEtag(): Promise<string | null> {
  return kvGetString(ETAG_KEY);
}

/**
 * Store the latest ETag for the awesome list in KV.
 */
export async function storeEtag(etag: string) {
  await kvSetString(ETAG_KEY, etag);
}