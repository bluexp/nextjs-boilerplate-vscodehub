# VSCodeHub — Awesome AI Catalog

一个基于 Next.js App Router 的开源目录应用，提供分类浏览、全文搜索、主题切换与边缘运行时（Edge Runtime）加速。

## 技术栈
- Next.js 15（App Router, Edge Runtime）
- TypeScript + Tailwind 风格样式
- next-themes（系统/亮/暗主题）
- Upstash Redis（KV 数据存储，REST API）

## 快速开始
1. 安装依赖并启动开发服务器：
```bash
npm i
npm run dev
# 打开 http://localhost:3000
```
2. 配置环境变量（创建 .env.local）：
```bash
# 二选一：使用 KV_* 或 UPSTASH_*（推荐使用你的 Upstash Redis REST 凭据）
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
# 或
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# 可选：用于提升 GitHub 拉取频率限制
GITHUB_TOKEN=...

# 仅生产使用：用于 /api/admin/sync 鉴权（Cron 触发）
CRON_SECRET=your-strong-secret
```
3. 初始化数据（同步 Awesome 列表）：
- 本地开发环境可直接访问（开发模式跳过鉴权）：
  - GET/POST `http://localhost:3000/api/admin/sync?force=1`
- 看到响应 `{"ok": true, "stored": true}` 即同步成功。

4. 验证 API：
```bash
# 目录
curl http://localhost:3000/api/catalog
# 分类
curl http://localhost:3000/api/categories
# 搜索
curl "http://localhost:3000/api/search?q=react"
```

## 健康检查（生产可用）
- 路径：`/api/health`
- 含义：
  - HTTP 200：健康；`details.kv=connected`，`details.catalog=ready/empty`（空仅提示，不代表失败）
  - HTTP 503：不健康（KV 配置/连接失败）

## 同步任务（生产环境）
- 端点：`/api/admin/sync`（GET/POST 均可）
- 鉴权（仅生产）：
  - Header: `x-cron-secret: <CRON_SECRET>` 或 `Authorization: Bearer <CRON_SECRET>`
- 定时：项目包含 `vercel.json` 中的 Cron 配置示例（每 12 小时）：
```json
{
  "crons": [
    { "path": "/api/admin/sync", "schedule": "0 */12 * * *" }
  ]
}
```
提示：如在 Vercel 控制台使用 Cron Jobs，可设置自定义 Header 传递 `x-cron-secret`。

## 常见问题（Troubleshooting）
- `GET /api/catalog 404 {"error":"Catalog not found. Run sync first."}`
  - 说明：API 正常，但 KV 尚未写入数据。解决：先触发 `/api/admin/sync?force=1`。
- `GET /@vite/client 404`
  - 开发环境下无害日志，可忽略。
- GitHub 速率限制
  - 建议配置 `GITHUB_TOKEN` 以提升拉取频率上限。
- KV 连接失败（/api/health 返回 503）
  - 检查 `KV_REST_API_URL/TOKEN` 或 `UPSTASH_REDIS_REST_URL/TOKEN` 是否正确。

## 开发说明
- 主题切换：右上角按钮，使用 next-themes，默认跟随系统，可手动切换亮/暗。
- 首页头部：滚动透明效果，滚动超 80px 自动显示背景与阴影。

## 许可
MIT
