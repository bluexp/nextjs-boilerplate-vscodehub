# 环境变量获取与配置指南（vscodehub.com）

本文档指导你获取并配置项目所需的 3 个关键环境变量：
- GITHUB_TOKEN（提升 GitHub API 调用速率、用于读取公开仓库）
- KV 连接配置（Vercel KV：KV_REST_API_URL、KV_REST_API_TOKEN、KV_REST_API_READ_ONLY_TOKEN）
- CRON_SECRET（定时任务与管理接口校验密钥）

适用环境：Production、Preview（推荐均配置）；Development（本地可放在 .env.local）。

---

## 1) 获取 GITHUB_TOKEN

用途：用于拉取 sindresorhus/awesome 仓库内容，避免匿名调用的速率限制（匿名仅 60 次/小时，带 Token 可达 5000 次/小时）。

步骤：
1. 登录 GitHub，访问个人设置页面：`https://github.com/settings/tokens`
2. 选择“Generate new token”，可选：
   - Fine-grained personal access token（推荐，粒度更细）
   - 或 Classic token（简单易用）
3. 配置 Token：
   - Note（备注）：如 `vscodehub-sync`
   - Expiration（过期时间）：90 天或 No expiration（视安全策略而定）
   - 权限范围（Scopes/Repository access）：
     - 访问公开仓库即可（Fine-grained 选择“Only select repositories”或“Public repositories”；Classic 勾选 `public_repo` 即可）
4. 生成后复制 Token（形如 `ghp_********`）。

在 Vercel 上添加：
- Key: `GITHUB_TOKEN`
- Value: 你的 Token 值
- Environments: Production、Preview（Development 可放 `.env.local`）

本地开发（可选）：在项目根目录创建 `.env.local`（已被 .gitignore 忽略）：
```bash
# .env.local
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 2) 配置 Vercel KV（连接信息）

用途：缓存与存储标准化数据（分类/条目/元数据），支撑站点的快速响应与增量更新。

步骤：
1. 打开 Vercel Dashboard，进入你的项目。
2. 进入“Storage”标签，点击“Create Database”。
3. 选择“KV”，填写数据库名称（例如 `vscodehub-cache`），选择靠近目标用户的 Region（如 `hkg1`、`iad1`）。
4. 创建完成后点击“Connect Project”，选择当前项目并连接。

完成连接后，Vercel 会自动为项目注入以下环境变量：
```bash
KV_REST_API_URL=https://xxxxxx-xxxxxx.kv.vercel-storage.com
KV_REST_API_TOKEN=xxxxxxxxxxxxxxxxxx
KV_REST_API_READ_ONLY_TOKEN=xxxxxxxxxxxxxxxxxx
```

提示：免费额度通常足够（每月请求与存储有免费层），数据读写可以先从只读/读写 Token 区分权限。

---

## 3) 生成并配置 CRON_SECRET

用途：保护内部同步/管理接口（如 `/api/admin/sync`），仅允许受信任的 Cron 任务或后台触发。

生成强随机密钥（Mac 终端）：
```bash
# 方式一：OpenSSL（推荐）
openssl rand -hex 32

# 方式二：Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
将输出的 64 位十六进制字符串设置到 Vercel 环境变量：
- Key: `CRON_SECRET`
- Value: 生成的随机字符串
- Environments: Production、Preview（Development 可放 `.env.local`）

在 Vercel Cron Jobs 中配置调用命令（示例）：
- Schedule: `0 3 * * *`（每天 03:00 UTC）
- Command: `curl -X POST https://vscodehub.com/api/admin/sync -H "x-cron-secret: YOUR_CRON_SECRET"`

注意：我们会在 `/api/admin/sync` 中校验 `x-cron-secret` 请求头是否与 `CRON_SECRET` 一致。

---

## 4) 在 Vercel 中添加/管理环境变量

路径：Vercel Dashboard → 选择项目 → Settings → Environment Variables。

添加以下键值（按需）：
```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CRON_SECRET=your-strong-random-hex
KV_REST_API_URL=https://xxxxxx-xxxxxx.kv.vercel-storage.com
KV_REST_API_TOKEN=xxxxxxxxxxxxxxxxxx
KV_REST_API_READ_ONLY_TOKEN=xxxxxxxxxxxxxxxxxx
```
建议环境：
- Production：启用
- Preview：启用（便于预览环境验证）
- Development：本地通过 `.env.local`（避免写入仓库）

---

## 5) 本地开发示例（.env.local）

在项目根目录创建 `.env.local` 文件（不会被提交）：
```bash
# .env.local
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CRON_SECRET=your-local-cron-secret
KV_REST_API_URL=https://xxxxxx-xxxxxx.kv.vercel-storage.com
KV_REST_API_TOKEN=xxxxxxxxxxxxxxxxxx
# 可选：如果只读访问足够
# KV_REST_API_READ_ONLY_TOKEN=xxxxxxxxxxxxxxxxxx
```

---

## 6) 配置验证方法

- 验证 GITHUB_TOKEN：
  ```bash
  curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/rate_limit
  ```
  返回中应包含较高的速率上限（core.limit ~ 5000）。

- 验证 KV：在 Vercel KV Dashboard 里进行一次读写测试；或等待我们提供的健康检查接口。

- 验证 CRON_SECRET：部署后请求 `/api/admin/sync`（需等对应接口实现），请求头带上 `x-cron-secret: $CRON_SECRET` 应返回 200。

---

## 7) 安全与最佳实践

- 切勿在代码库中硬编码任何 Token/Secret。
- 仅赋予最小权限：
  - GitHub Token 仅需公开仓库读取权限（public_repo）。
  - KV 使用只读 Token 渲染前台页面，读写 Token 仅在同步/管理端使用。
- 定期轮换 Token（建议 3-6 个月），并移除不再使用的密钥。
- 不在日志中输出 Token/Secret 值；必要时仅输出被掩码的前后几位。
- `.env*` 文件已在 `.gitignore` 中忽略，无需担心误提交。

---

完成以上配置后，请把你已经设置好的变量告知我（至少 GITHUB_TOKEN 与 CRON_SECRET）。我将开始实现同步与解析逻辑，并提供相应的 API 与页面以便预览与验证。