# VSCodeHub — Awesome AI Catalog
[![License: CC0-1.0](https://img.shields.io/badge/License-CC0_1.0-lightgrey.svg)](https://creativecommons.org/publicdomain/zero/1.0/)
该项目是依托GPT-5自动化编程的项目
This project is built with GPT‑5-assisted automated programming.

An open-source catalog application built with Next.js App Router. It features categorized browsing, full‑text search, theme switching, and Edge Runtime acceleration.

- English (default) | [中文文档](./README.zh-CN.md)

## Tech Stack
- Next.js 15 (App Router, Edge Runtime)
- TypeScript + Tailwind-based styling
- next-themes (system/light/dark)
- Upstash Redis (KV via REST API)

## Getting Started
1) Install dependencies and start the dev server:
```bash
npm i
npm run dev
# Open http://localhost:3000
```

2) Configure environment variables (create .env.local):
```bash
# Choose ONE of the following (KV_* or UPSTASH_*). Using your Upstash Redis REST credentials is recommended.
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
# OR
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Optional: increase GitHub API rate limits for syncing
GITHUB_TOKEN=...

# Production only: auth secret for /api/admin/sync (Cron trigger)
CRON_SECRET=your-strong-secret
```

3) Initialize data (sync Awesome list):
- For local development (auth bypassed in dev):
  - GET/POST `http://localhost:3000/api/admin/sync?force=1`
- Expect a successful response like: `{ "ok": true, "stored": true }`.

4) Verify APIs:
```bash
# Catalog
curl http://localhost:3000/api/catalog
# Categories
curl http://localhost:3000/api/categories
# Search
curl "http://localhost:3000/api/search?q=react"
```

## Health Check (Production-ready)
- Endpoint: `/api/health`
- Semantics:
  - HTTP 200: healthy; `details.kv=connected`, `details.catalog=ready/empty` (empty is a hint, not a failure)
  - HTTP 503: unhealthy (KV misconfigured or unreachable)

## Scheduled Sync (Production)
- Endpoint: `/api/admin/sync` (supports GET/POST)
- Auth in production:
  - Header: `x-cron-secret: <CRON_SECRET>` or `Authorization: Bearer <CRON_SECRET>`
- Cron: see the example in `vercel.json` (runs every 12 hours):
```json
{
  "crons": [
    { "path": "/api/admin/sync", "schedule": "0 */12 * * *" }
  ]
}
```
Tip: If you configure Cron Jobs in Vercel dashboard, add the `x-cron-secret` header.

## Troubleshooting
- `GET /api/catalog 404 {"error":"Catalog not found. Run sync first."}`
  - API is fine but KV has no data yet. Run `/api/admin/sync?force=1` first.
- `GET /@vite/client 404`
  - Benign log in dev; safe to ignore.
- GitHub rate limit
  - Configure `GITHUB_TOKEN` to increase API limits.
- KV connection failure (`/api/health` returns 503)
  - Check `KV_REST_API_URL/TOKEN` or `UPSTASH_REDIS_REST_URL/TOKEN`.

## Development Notes
- Theme toggle: top-right switch using next-themes; follows system by default, can be toggled to light/dark.
- Home header: transparent on top; after ~80px scroll, background and shadow appear.

## License
CC0 1.0 Universal

- Summary: No rights reserved; as close as possible to public domain.
- Deed: https://creativecommons.org/publicdomain/zero/1.0/
- Legalcode: https://creativecommons.org/publicdomain/zero/1.0/legalcode
