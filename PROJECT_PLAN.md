# vscodehub.com 项目计划（基于 sindresorhus/awesome 持续更新的导航站）

> 数据来源：sindresorhus/awesome（CC0-1.0 许可），建议在站点显著位置致谢与标注来源。
> 仓库链接：https://github.com/sindresorhus/awesome

## 一、项目背景与目标
- 面向开发者，构建一个持续更新的导航网站 vscodehub.com。
- 自动同步 awesome 仓库的分类与条目，提供高可用的检索与浏览体验。
- 首期目标（MVP）：静态化、高性能、可收录、零登录、日常自动更新。

## 二、MVP 范围（约 2 周）
- 首页：展示顶级分类（Platforms、Programming Languages、Front-End 等）与搜索框。
- 分类页：展示该分类下的子清单/条目卡片（名称、描述、外链）。
- 搜索：站内模糊搜索（名称/描述）。
- 数据更新：每日定时抓取并解析 README/子文档，生成标准化 JSON，增量更新缓存。
- 部署：Vercel 托管，绑定自定义域名 vscodehub.com。
- SEO：基础 metadata、sitemap、robots、动态 OG 图。
- 性能：尽量静态化（ISR/边缘缓存），优化首屏与资源。

## 三、架构设计（Next.js 15 + App Router）
- 前端：Next.js App Router（/app），Tailwind CSS v4，响应式与暗色主题。
- 数据层：
  - 抓取：GitHub API（优先，结合 ETag/If-None-Match）；必要时读取 raw 内容。
  - 解析：remark/unified 将 Markdown 转 AST，提取分类与条目。
  - 存储与缓存：Vercel KV（或 Upstash Redis）作为热数据缓存；必要时持久化 JSON 快照。
- 后端 API：/api/categories、/api/catalog、/api/search（优先 Edge Runtime），统一响应结构与缓存。
- 更新机制：
  - Vercel Cron：定时触发同步任务（建议每天）。
  - 可选 GitHub Webhook：监听 awesome 仓库 push 事件，触发增量刷新。
- 构建与渲染：
  - 首页/分类页静态化 + ISR（revalidate N 分钟）。
  - 搜索：MVP 客户端模糊检索，后期可接服务端或 Algolia。

## 四、数据模型（标准化）
- Category
  - id: string（slug）
  - title: string
  - description?: string
  - parentId?: string（父子层级）
  - count: number（条目计数）
- Item
  - id: string（基于 url 哈希）
  - categoryId: string
  - title: string
  - description?: string
  - url: string
  - tags?: string[]
  - createdAt/updatedAt: ISO string
- Meta
  - source: 'awesome'
  - lastCommitSha: string
  - lastSyncedAt: ISO string

## 五、关键里程碑与任务拆解
M0：准备与域名（0.5 天）
- 创建 Vercel 项目，绑定 vscodehub.com（DNS CNAME）。
- 配置环境变量：GITHUB_TOKEN、KV 连接、CRON secret。

M1：数据抓取与解析（2-3 天）
- 使用 GitHub API 拉取 awesome 根 README 与必要子文档（含 ETag）。
- 采用 remark 解析 Markdown -> AST；抽取目录、子目录、条目链接与描述。
- 设计清洗/规范化逻辑（去重、描述裁剪、符号与多语言容错）。
- 单元测试覆盖典型段落/列表/链接结构。

M2：缓存与增量更新（1-2 天）
- 选用 Vercel KV/Upstash Redis；设计 Category/Item/Meta 三类键空间。
- 以 lastCommitSha 判定是否变更；提供强制刷新接口。
- Vercel Cron：每日 1 次（可调）；记录执行日志与失败告警。

M3：API 设计与实现（2 天）
- /api/categories：返回类别树或扁平列表。
- /api/catalog?category=xxx：按分类返回条目（分页）。
- /api/search?q=xxx：模糊检索（MVP 客户端，后期支持服务端/Algolia）。
- 提供 ETag、Cache-Control；稳定排序与命中高亮（可选）。

M4：前端界面与交互（3-4 天）
- 首页：搜索框、分类导航、最近更新（基于 Meta/快照对比）。
- 分类页：卡片栅格、筛选/排序（时间/热度/字母）。
- 外链：新窗口打开；favicon 显示（基于域名图标服务或自抓取）。
- 组件：Header/Footer、主题切换（暗/浅）、面包屑、空状态与骨架屏。

M5：SEO 与分享（1-2 天）
- 完整 metadata：title/description/keywords/metadataBase/openGraph/twitter。
- 动态 OG 图（next/og）：分类/搜索分享卡片。
- sitemap.ts、robots.ts：确保索引与抓取策略合理。

M6：质量保障与部署（1-2 天）
- Lint/TS 严格模式、核心单元测试。
- 简单 E2E（Playwright）覆盖主路径与搜索跳转。
- 部署至 Vercel + 观测（Vercel Analytics/Speed Insights），优化 Web Vitals。
- 持续性能优化：静态化、缓存策略、图片与包体积优化。

## 六、技术选型建议
- 解析：unified/remark-parse/remark-gfm
- 缓存：Vercel KV（或 Upstash Redis 免费层）
- 搜索：MVP 先 Fuse.js（客户端）；后期接 Algolia
- UI：Tailwind CSS v4 + Headless UI/Radix UI（按需）
- 图标：favicon 抓取（next/image 配置 remotePatterns）
- 监控：Vercel Analytics、Sentry（可选）

## 七、风险与应对
- GitHub API 速率限制：使用令牌、ETag 条件请求、降低频率；Cron 合理安排。
- Markdown 结构变动：解析器容错与快照测试；回退策略。
- 数据体量增长：分页与懒加载；必要时引入专用搜索服务。
- 外链可用性：异步链接健康检查；失效链接标记/降权。

## 八、时间排期（10-12 个工作日）
- 第 1-2 天：M0 + M1（基础抓取/解析）
- 第 3-4 天：M1 完成 + M2（缓存与增量）
- 第 5-6 天：M3（API）
- 第 7-9 天：M4（前端 UI/交互）
- 第 10 天：M5 + M6（SEO、测试、部署）
- 预留 1-2 天：上线观察与修正

## 九、上线交付清单
- 代码仓库（主分支 + CI）
- 环境变量与 Vercel 项目配置说明
- 数据同步任务（Cron）说明与“手动刷新”接口
- 解析器单测与关键路径 E2E 脚本
- 站点使用与维护指南（简版）

## 十、待确认信息
- 域名：vscodehub.com 是否已在 Vercel 绑定？
- SEO/品牌：站点标题/描述（中英）与社交分享信息。
- 更新频率：默认每日 1 次，是否需要更高频（可用 webhook）？
- 是否需要多语言（中英）作为后续迭代目标？
- 首页是否需要“推荐/精选”区块（手动置顶）？