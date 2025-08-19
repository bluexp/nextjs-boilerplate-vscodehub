# VSCodeHub — Awesome AI Catalog
[![License: CC0-1.0](https://img.shields.io/badge/License-CC0_1.0-lightgrey.svg)](https://creativecommons.org/publicdomain/zero/1.0/)
该项目是依托GPT-5自动化编程的项目
This project is built with GPT‑5-assisted automated programming.

An open-source, production‑ready catalog application powered by Next.js App Router and the Edge Runtime. It provides categorized browsing of curated resources, fast full‑text search, theme switching, and a scheduled sync pipeline that parses the upstream Awesome list into a structured catalog stored in Upstash Redis (KV via REST).

- English (default) | [中文文档](./README.zh-CN.md)

## Highlights
- Clean App Router architecture (Next.js 15) with Edge Runtime on API routes for low latency
- Structured catalog with categories and subcategories, plus a flat list for efficient search
- Server-rendered pages with smooth client UX; responsive and fast
- Full‑text search with simple term matching and limit control
- Theme switching (system / light / dark) via next-themes
- Health check endpoint suitable for platform monitoring
- Scheduled sync (Cron) to pull and parse the upstream Awesome list

## Tech Stack
- Next.js 15 (App Router, Edge Runtime)
- TypeScript + Tailwind-based styling
- next-themes for theme management
- Upstash Redis (KV via REST API)
- Jest + Testing Library for unit tests

## Project Structure (key parts)
- app/ — App Router pages and API routes
- components/ — UI and client components
- lib/ — KV access, parser, utilities
- types/ — Shared TypeScript types

## Getting Started
1) Install and run locally
```bash
npm i
npm run dev
# open http://localhost:3000
```

2) Environment variables (.env.local)
```bash
# Choose ONE set (KV_* or UPSTASH_*). Using Upstash Redis REST credentials is recommended.
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
# OR
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Optional: increase GitHub API rate limits for syncing
GITHUB_TOKEN=...

# Production only: secret for /api/admin/sync (Cron auth)
CRON_SECRET=your-strong-secret
```

3) Seed data (sync Awesome list)
- Local dev bypasses auth; trigger a sync:
  - GET/POST `http://localhost:3000/api/admin/sync?force=1`
- Expected response: `{ "ok": true, "stored": true, "meta": { ... } }` or `{ "ok": true, "stored": false, "message": "Not modified" }`.

4) Verify APIs quickly
```bash
# Catalog (full data)
curl http://localhost:3000/api/catalog
# Categories (titles + slugs)
curl http://localhost:3000/api/categories
# Search (simple term matching)
curl "http://localhost:3000/api/search?q=react&limit=10"
# Health
curl -i http://localhost:3000/api/health
```

## API Reference (Edge Runtime)
All API routes run on the Edge Runtime and return JSON with a common shape.

- Response wrapper (generic):
```ts
interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}
```

- GET /api/health
  - 200 when KV is reachable: `{ ok: true, details: { kv: "connected", catalog: "ready"|"empty" } }`
  - 503 when KV is misconfigured/unreachable: `{ ok: false, details: { kv: "unavailable", error: "..." } }`

- GET /api/catalog
  - 200: `{ ok: true, data: AwesomeCatalog }`
  - 404: `{ ok: false, error: "Catalog not found. Run sync first." }`

- GET /api/categories
  - 200: `{ ok: true, data: Array<{ title: string; slug: string; subcategories: Array<{ title: string; slug: string }> }> }`

- GET /api/search?q=<terms>&limit=<n>
  - 200: `{ ok: true, data: { query, limit, total, items } }`
  - 400 if `q` is missing/empty.

- POST /api/admin/sync (Edge) | also supports GET
  - Dev: auth is bypassed for convenience
  - Prod auth (choose one):
    - Header: `x-cron-secret: <CRON_SECRET>`
    - Header: `Authorization: Bearer <CRON_SECRET>`
  - Optional: `?force=1` or header `x-force-sync: 1` to bypass ETag and refresh

## Data Model (types)
```ts
// A curated resource item
export interface AwesomeItem {
  title: string;
  url: string;
  description?: string;
  category: string;
  subcategory?: string;
}

// A category (H2) which may include subcategories (H3)
export interface AwesomeCategory {
  title: string;
  slug: string;
  items: AwesomeItem[];
  children: AwesomeCategory[];
}

// Full catalog with both tree and flat list
export interface AwesomeCatalog {
  tree: AwesomeCategory[];
  list: AwesomeItem[];
  meta: { updatedAt: string; totalItems: number; version: number };
}
```

## Sync & Cron (Production)
- Endpoint: `/api/admin/sync` (GET/POST)
- Cron example (vercel.json):
```json
{
  "crons": [
    { "path": "/api/admin/sync", "schedule": "0 */12 * * *" }
  ]
}
```
- If you configure Cron Jobs in the Vercel dashboard, add a custom header `x-cron-secret: <CRON_SECRET>`.

## Deployment (Vercel)
- Connect the repository and set required environment variables
- Ensure Cron is configured (either via vercel.json or dashboard)
- Production build: `npm run build`; start: `npm start`

## Development Tips
- Scripts: `dev` (Turbopack), `build`, `start`, `lint`, `test`
- Theme toggle lives in the global header (next-themes). Default follows system preference
- Accessibility: a “Skip to content” link is available for keyboard users
- SEO: robots.txt and sitemap.xml are served from the app directory

## Troubleshooting
- 404 on `/api/catalog`: Run `/api/admin/sync?force=1` to seed data
- 503 on `/api/health`: Check `KV_REST_API_URL/TOKEN` or `UPSTASH_REDIS_REST_URL/TOKEN`
- GitHub rate limit: set `GITHUB_TOKEN` to increase API limits for the sync pipeline

## Testing
- Run unit tests with Jest: `npm test`
- The markdown parser dynamically imports ESM packages; a test‑only fallback keeps tests reliable

## License
CC0 1.0 Universal

- Summary: No rights reserved; as close as possible to public domain
- Deed: https://creativecommons.org/publicdomain/zero/1.0/
- Legalcode: https://creativecommons.org/publicdomain/zero/1.0/legalcode

## Acknowledgements
- Inspired by the Awesome list by sindresorhus
- Upstash for Redis KV (REST API)
- Next.js team and community
