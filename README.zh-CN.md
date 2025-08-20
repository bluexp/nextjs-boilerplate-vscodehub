# VSCodeHub — Awesome AI Catalog
[![License: CC0-1.0](https://img.shields.io/badge/License-CC0_1.0-lightgrey.svg)](https://creativecommons.org/publicdomain/zero/1.0/)
该项目是依托GPT-5自动化编程的项目

[English](./README.md) | 中文（当前）

一个基于 Next.js App Router 的开源目录应用，提供分类浏览、全文搜索、主题切换、国际化（i18n）与边缘运行时（Edge Runtime）加速。

## 技术栈
- Next.js 15（App Router, Edge Runtime）
- TypeScript + Tailwind 风格样式
- next-themes（系统/亮/暗主题）
- Upstash Redis（KV 数据存储，REST API）
- **@vercel/og + satori**（动态社交分享图片）
- 内置 i18n（客户端 Context + 服务器端语言检测 headers/cookies）

## 新增功能
### 国际化（i18n）
- 支持语言：英文（en）、中文（zh）、西班牙语（es）、日语（ja）
- 服务器端语言自动检测：
  - 优先读取 cookie `language`（由客户端切换器写入，保存 1 年）
  - 回退解析请求头 `Accept-Language`，按质量权重（q）排序选择支持语言的主语言代码
  - 默认语言为英文（en）
- 客户端语言切换：
  - 组件：`<LanguageSwitcher />`（位于全局头部）
  - 同步 localStorage 和 cookie，刷新后 SSR/CSR 一致
  - `<HtmlLangUpdater />` 会在客户端同步 `<html lang>` 属性
- 服务器端翻译：
  - `createServerTranslator()`：在服务器组件中获取 `t(key)` 与当前语言
  - `getServerTranslation(key)`：在元数据 `generateMetadata` 等场景快速取文案
- 元数据本地化：
  - 首页与分类页已接入本地化标题、描述、OpenGraph、Twitter 等字段
  - 使用动态 OG 图片 `/api/og`，会根据本地化标题呈现

### 动态 OG 分享图
- 接口：`/api/og`，支持查询参数 `title` 与 `subtitle`
- 用法：已集成到首页与分类页的元数据中，分享卡片自动展示
- 示例：`http://localhost:3000/api/og?title=AI%20Tools&subtitle=Curated%20Collection`
- 特性：渐变背景、品牌风格、Edge Runtime 性能优化

### Newsletter 订阅
- 前端：页脚 Newsletter 表单，带基础邮箱校验
- 后端：`/api/newsletter` 将订阅者存储于 KV
- 存储结构：键 `newsletter:subscribers`，值为 email → subscribedAt 映射
- 特性：重复订阅拦截、提交成功/失败状态提示

### SEO 增强
- 丰富的 meta 信息（title/description/keywords）
- Open Graph / Twitter Cards
- JSON-LD 结构化数据：WebSite、Organization、BreadcrumbList、CollectionPage
- SearchAction：适配站内搜索结构化数据（有助于搜索引擎理解）
- 分类页：基于分类动态生成元数据

### 社区共建
- 新增 GitHub Issue 模板：`.github/ISSUE_TEMPLATE/submit-resource.yml`
- 页脚新增“Submit Resource”入口链接
- 支持分类：AI、Web Development、DevOps、Security、Data Engineering、Other

## 快速开始
1. 安装依赖并启动开发服务器：
```bash
npm i
npm run dev
# 打开 http://localhost:3000
```
2. 配置环境变量（创建 .env.local）：
```bash
# 二选一：使用 KV_* 或 UPSTASH_*（推荐使用 Upstash Redis REST 凭据）
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
# 或
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# 可选：提升 GitHub 拉取速率限制
GITHUB_TOKEN=...

# 仅生产：/api/admin/sync 的鉴权密钥（用于 Cron）
CRON_SECRET=your-strong-secret
```
3. 初始化数据（同步 Awesome 列表）：
- 本地开发可直接触发（开发模式跳过鉴权）：
  - GET/POST `http://localhost:3000/api/admin/sync?force=1`
- 预期返回：`{"ok":true,"stored":true,...}` 或 `{"ok":true,"stored":false,"message":"Not modified"}`

4. 快速验证 API：
```bash
# 目录数据
curl http://localhost:3000/api/catalog
# 分类列表
curl http://localhost:3000/api/categories
# 搜索
curl "http://localhost:3000/api/search?q=react&limit=10"
# 健康检查
curl -i http://localhost:3000/api/health
# 动态 OG 图片
curl "http://localhost:3000/api/og?title=VSCodeHub&subtitle=Awesome%20AI%20Catalog"
```

## API 参考（Edge Runtime）
- 通用响应结构：
```ts
interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}
```

- GET /api/og?title=<title>&subtitle=<subtitle>（新增）
  - 200：返回 1200×630 PNG 图片
  - 用于页面社交分享卡片（已自动集成）

- POST /api/newsletter（新增）
  - Body: `{ email: string }`
  - 200：`{ ok: true, message: "Subscribed successfully" }`
  - 400：`{ ok: false, error: "Invalid email" }`
  - 409：`{ ok: false, error: "Already subscribed" }`

- 其他 API：/api/catalog、/api/categories、/api/search、/api/admin/sync、/api/health 保持不变

## 开发与部署
- 开发脚本：`dev`（Turbopack）、`build`、`start`、`lint`、`test`
- OG 图片：默认在 Edge Runtime 下工作；Vercel 部署开箱即用
- Newsletter：使用 KV 存储，无额外部署配置
- SEO：robots.txt 与 sitemap.xml 从 app 目录生成

## 常见问题（Troubleshooting）
- `/api/catalog` 404：先执行 `/api/admin/sync?force=1` 写入数据
- `/api/health` 503：检查 `KV_REST_API_URL/TOKEN` 或 `UPSTASH_REDIS_REST_URL/TOKEN`
- OG 图片不显示：检查部署是否运行在 Edge Runtime，以及图片 URL 是否正确
- Newsletter 不生效：检查 KV 连接，或打开浏览器控制台查看错误信息
- 页面被标记为“动态渲染”：由于使用了 `headers()/cookies()` 进行语言检测，Next.js 会将相关路由设为动态；这是预期行为
- 测试 i18n：切换语言后刷新页面，检查 `<html lang>`、页面文案、元数据（OG/Twitter）是否已本地化

## 许可
CC0 1.0 Universal（公有领域贡献）

- 简述：尽可能放弃权利，使作品进入公有领域，任何人可自由使用、修改与再分发（无需署名）。
- 说明页（Deed）：https://creativecommons.org/publicdomain/zero/1.0/deed.zh
- 法律文本（Legalcode）：https://creativecommons.org/publicdomain/zero/1.0/legalcode.zh