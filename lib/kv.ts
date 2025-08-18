import { getEnv } from "@/lib/utils";
import type { AwesomeCatalog } from "@/types";

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
 * Get a value from KV by REST API.
 * This uses Upstash Redis REST protocol: GET /get/<key>
 */
async function kvGet<T>(key: string): Promise<T | null> {
  const { url, token } = resolveKvEnv();
  const endpoint = `${url.replace(/\/$/, "")}/get/${encodeURIComponent(key)}`;
  const res = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store", // Always fetch the latest from KV
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`KV get failed: ${res.status} ${res.statusText} ${text}`);
  }

  const json = await res.json();
  if (json.result) {
    return JSON.parse(json.result) as T;
  }
  return null;
}

const CATALOG_KEY = "awesome:catalog";

/**
 * Fetches the full awesome catalog from the KV store.
 */
export async function getCatalog(): Promise<AwesomeCatalog | null> {
  return kvGet<AwesomeCatalog>(CATALOG_KEY);
}