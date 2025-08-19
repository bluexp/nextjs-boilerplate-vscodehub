import { getEnv } from "@/lib/utils";
import type { AwesomeCatalog, AwesomeCategory, AwesomeItem } from "@/types";

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
 * Flatten all items from a category tree into a single list.
 * Build the missing `list` field (for backward compatibility with older data structures).
 */
function flattenItemsFromTree(tree: AwesomeCategory[] | undefined): AwesomeItem[] {
  if (!Array.isArray(tree) || tree.length === 0) return [];
  const out: AwesomeItem[] = [];
  const walk = (cats: AwesomeCategory[]) => {
    for (const c of cats) {
      if (Array.isArray(c.items) && c.items.length) out.push(...c.items);
      if (Array.isArray(c.children) && c.children.length) walk(c.children);
    }
  };
  walk(tree);
  return out;
}

/**
 * Normalize arbitrary catalog-like data into the AwesomeCatalog shape.
 * Compatible with the following scenarios:
 * - Legacy structure using { categories: AwesomeCategory[] } instead of { tree }
 * - Auto-generate flat list from tree structure when missing
 * - Auto-fill default meta when missing
 *
 * Note: This function is fault-tolerant and returns null when unrecognizable.
 */
function normalizeCatalog(raw: any): AwesomeCatalog | null {
  if (!raw || typeof raw !== "object") return null;

  // 1) Handle naming difference between `tree` and `categories`
  const tree: AwesomeCategory[] | undefined = Array.isArray(raw.tree)
    ? (raw.tree as AwesomeCategory[])
    : Array.isArray(raw.categories)
      ? (raw.categories as AwesomeCategory[])
      : undefined;
  if (!Array.isArray(tree) || tree.length === 0) {
    return null;
  }

  // 2) Use existing list if provided; otherwise build from tree
  const list: AwesomeItem[] = Array.isArray(raw.list) && raw.list.length > 0
    ? (raw.list as AwesomeItem[])
    : flattenItemsFromTree(tree);

  // 3) Compose meta
  const legacyUpdated = (raw.meta && raw.meta.updatedAt) || raw.updatedAt;
  const meta = {
    updatedAt: typeof legacyUpdated === "string" && legacyUpdated
      ? legacyUpdated
      : new Date().toISOString(),
    totalItems: typeof (raw.meta?.totalItems) === "number" && raw.meta.totalItems >= 0
      ? raw.meta.totalItems
      : list.length,
    version: typeof (raw.meta?.version) === "number"
      ? raw.meta.version
      : 2,
  };

  return { tree, list, meta } as AwesomeCatalog;
}

/**
 * Fetches the full awesome catalog from the KV store.
 * Normalize after reading to ensure backward compatibility and avoid empty UI states on the frontend.
 */
export async function getCatalog(): Promise<AwesomeCatalog | null> {
  const raw = await kvGet<any>(CATALOG_KEY);
  return normalizeCatalog(raw);
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