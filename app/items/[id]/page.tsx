import { getCatalog } from "@/lib/kv";
import type { AwesomeItem, AwesomeCategory } from "@/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import { Star, Share2, ExternalLink, Link as LinkIcon, BookOpen, FileText, Video as VideoIcon, Home, Github } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createServerTranslator } from "@/lib/i18n-server";
import type { Language } from "@/lib/i18n";

/**
 * Decode a base64url string to the original URL string.
 * - base64url is base64 with '-' and '_' instead of '+' and '/'
 */
function decodeBase64Url(input: string): string {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

/**
 * Get a favicon URL for a given site URL using Google's favicon service.
 */
function getFaviconUrl(url: string): string {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return "";
  }
}

/**
 * Find an item in the catalog by its external URL.
 */
async function findItemByUrl(url: string): Promise<AwesomeItem | null> {
  const catalog = await getCatalog();
  if (!catalog) return null;
  const list = Array.isArray(catalog.list) ? catalog.list : [];
  return list.find((it) => it.url === url) ?? null;
}

/**
 * Build site base URL for absolute OG/Twitter images.
 */
function getSiteUrl(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return base.replace(/\/$/, "");
}

/**
 * Generate metadata for the item detail page.
 * - Title/description are derived from the item
 * - OpenGraph/Twitter use dynamic OG image via /api/og
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = decodeBase64Url(id);
  const item = await findItemByUrl(url);
  const { t } = await createServerTranslator("en" as Language);
  if (!item) return { title: t("item.notFoundTitle", "Item Not Found") };

  const siteUrl = getSiteUrl();
  const domain = (() => {
    try {
      return new URL(item.url).hostname;
    } catch {
      return "";
    }
  })();
  const og = `${siteUrl}/api/og?title=${encodeURIComponent(item.title)}&subtitle=${encodeURIComponent(domain)}`;

  const title = `${item.title} — VSCodeHub`;
  const description = item.description || `${item.title} in ${item.category}${item.subcategory ? ` / ${item.subcategory}` : ""}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: og }],
      type: "article",
      url: `${siteUrl}/items/${id}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [og],
    },
  };
}

/**
 * ItemDetailPage — 资源二级详情页
 * 根据 URL 参数定位资源，展示标题、说明、分类、内容预览（Contents 类目）等，并提供外链访问与分享。
 */
export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // 解析 id -> 外链 URL
  const { id } = await params;
  const decodedUrl = decodeBase64Url(id);

  // 定位资源，找不到则 404
  const item = await findItemByUrl(decodedUrl);
  if (!item) {
    notFound();
  }

  // 基于目标 URL 猜测展示语言，并创建服务器端翻译器
  const hint = detectLanguageFromUrl(item.url) as Language | undefined;
  const { t } = await createServerTranslator(hint ?? "en");

  // 基础派生信息
  const domain = (() => {
    try {
      return new URL(item.url).hostname;
    } catch {
      return "";
    }
  })();
  const favicon = getFaviconUrl(item.url);

  // GitHub 仓库元信息（若链接为 GitHub）
  const gh = parseGitHubRepo(item.url);
  const repoMeta = gh ? await fetchGitHubRepoMeta(gh.owner, gh.repo) : null;

  // 目录元信息（更新时间等）
  const catalog = await getCatalog();
  const catalogUpdatedAt = catalog?.meta?.updatedAt;

  // Contents 类目专属信息
  const isContents = isContentsCategory(item.category);
  const contentKind = isContents ? detectContentKind(item.url) : undefined;
  const languageHint = detectLanguageFromUrl(item.url);

  // 关联：当是 Contents 下的目录项（如 “Platforms”），从 KV 中找到同名分类并收集其所有链接
  const contentCategory = isContents && catalog?.tree ? findCategoryByTitle(catalog.tree, item.title) : null;
  const contentCategoryItems = contentCategory ? flattenCategoryItems(contentCategory) : [];

  // 相关内容（同类目，排除自身）
  const related = (catalog?.list ?? [])
    .filter((i: AwesomeItem) => (i.category ?? "").toLowerCase() === (item.category ?? "").toLowerCase() && i.url !== item.url)
    .slice(0, 6);

  // 分享链接
  const siteUrl = getSiteUrl();
  const permalink = `${siteUrl}/items/${id}`;
  const share = buildShareLinks(item.title, permalink, item.url);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Title */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">
          {item.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {favicon ? (
            <img src={favicon} alt={`${item.title} favicon`} className="h-4 w-4 rounded-sm" />
          ) : null}
          {domain ? <span>{domain}</span> : null}
          {gh && (
            <a
              href={`https://github.com/${gh.owner}/${gh.repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-foreground hover:underline"
            >
              <Star className="h-4 w-4" /> {t("button.starOnGitHub", "Star on GitHub")}
            </a>
          )}
        </div>
        {/* Action buttons: Back to Home + Open on GitHub */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" /> {t("button.backToHome", "Back to Home")}
            </Link>
          </Button>
          {gh ? (
            <Button asChild variant="outline">
              <a
                href={`https://github.com/${gh.owner}/${gh.repo}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("button.openOnGitHub", "Open on GitHub")}
              >
                <Github className="mr-2 h-4 w-4" /> {t("button.openOnGitHub", "Open on GitHub")}
                <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </Button>
          ) : null}
        </div>
      </header>

      {/* Meta chips */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full border border-border/50 bg-card px-2.5 py-1 text-xs text-muted-foreground">
          {t("category.label", "Category:")} {item.category}
        </span>
        {item.subcategory ? (
          <span className="inline-flex items-center rounded-full border border-border/50 bg-card px-2.5 py-1 text-xs text-muted-foreground">
            {t("subcategory.label", "Subcategory:")} {item.subcategory}
          </span>
        ) : null}
        {domain ? (
          <span className="inline-flex items-center rounded-full border border-border/50 bg-card px-2.5 py-1 text-xs text-muted-foreground">
            {t("domain.label", "Domain:")} {domain}
          </span>
        ) : null}
        {gh ? (
          <span className="inline-flex items-center rounded-full border border-border/50 bg-card px-2.5 py-1 text-xs text-muted-foreground">
            {t("details.githubRepo", "GitHub Repo")}
          </span>
        ) : null}
      </div>

      {/* Description card */}
      <section className="rounded-xl border border-border/50 bg-card/80 p-6 shadow-sm" style={{ display: isContents ? "none" : undefined }}>
        <h2 className="mb-2 text-lg font-semibold">{t("description.title", "Description")}</h2>
        <p className="leading-relaxed text-muted-foreground">{item.description || t("description.noDescription", "No description provided.")}</p>

        {/* Details grid */}
        <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          {catalogUpdatedAt ? (
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground/70">{t("details.lastSynced", "Last synced:")}</div>
              <div className="font-medium text-foreground">{catalogUpdatedAt}</div>
            </div>
          ) : null}
          {repoMeta?.updatedAt ? (
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground/70">{t("details.repoUpdated", "Repo updated:")}</div>
              <div className="font-medium text-foreground">{formatDate(repoMeta?.updatedAt)}</div>
            </div>
          ) : null}
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground/70">{t("details.stars", "Stars:")}</div>
            <div className="font-medium text-foreground">{formatNumber(repoMeta?.stars)}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground/70">{t("details.forks", "Forks:")}</div>
            <div className="font-medium text-foreground">{formatNumber(repoMeta?.forks)}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground/70">{t("details.openIssues", "Open issues:")}</div>
            <div className="font-medium text-foreground">{formatNumber(repoMeta?.issues)}</div>
          </div>
        </div>
      </section>

      {/* Possibly related links section heading */}
      {related?.length ? (
        <section className="mt-8">
          <h2 className="mb-2 text-lg font-semibold">{t("content.relatedLinks", "Related Links")}</h2>
          <ul className="space-y-2">
            {related.map((r) => (
              <li key={r.url}>
                <Link
                  href={`/items/${encodeUrlToId(r.url)}`}
                  className="flex items-start gap-3 rounded-md border border-transparent p-3 hover:border-border/60 hover:bg-accent/40"
                >
                  <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary/70" />
                  <span className="text-sm font-medium text-foreground group-hover:underline">{r.title}</span>
                </Link>
                {r.description ? (
                  <p className="ml-5 mt-1 line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Contents-specific: Category links only */}
      {isContents ? (
        <>
          {contentCategoryItems.length > 0 ? (
            <section className="mt-6 rounded-xl border border-border/50 bg-card/80 p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">{t("content.allLinksIn", "All links in {title}").replace("{title}", item.title)}</h2>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {contentCategoryItems.map((r) => (
                  <li key={r.url} className="group">
                    <Link
                      href={`/items/${encodeUrlToId(r.url)}`}
                      className="flex items-start gap-3 rounded-md border border-transparent p-3 hover:border-border/60 hover:bg-accent/40"
                    >
                      <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary/70" />
                      <span className="text-sm font-medium text-foreground group-hover:underline">{r.title}</span>
                    </Link>
                    {r.description ? (
                      <p className="ml-5 mt-1 line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}

      {/* JSON-LD for the item detail page */}
      <Script id="jsonld-item" type="application/ld+json">
        {JSON.stringify((() => {
          const kind = isContents ? contentKind : undefined;
          const base: Record<string, unknown> = {
            "@context": "https://schema.org",
            name: item.title,
            url: item.url,
            description: item.description || undefined,
            isPartOf: {
              "@type": "Collection",
              name: t("metadata.title", "VSCodeHub — Awesome Catalog"),
            },
            ...(gh ? { sameAs: [`https://github.com/${gh.owner}/${gh.repo}`] } : {}),
          };
          if (kind === "video") {
            return {
              ...base,
              "@type": "VideoObject",
              embedUrl: getYouTubeEmbedUrl(item.url) ?? undefined,
            };
          }
          if (kind === "docs" || kind === "article") {
            return {
              ...base,
              "@type": "Article",
              inLanguage: languageHint,
            };
          }
          return { ...base, "@type": "CreativeWork" };
        })())}
      </Script>
    </div>
  );
}

/**
 * Parse a GitHub repository URL and extract { owner, repo }.
 * Returns null if the URL is not a valid GitHub repository link.
 */
function parseGitHubRepo(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url);
    if (u.hostname !== "github.com") return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1].replace(/\.git$/, "") };
  } catch {
    return null;
  }
}

/**
 * Fetch GitHub repository metadata (stars, forks, issues, updatedAt).
 * Uses optional GITHUB_TOKEN to increase rate limits.
 */
async function fetchGitHubRepoMeta(owner: string, repo: string): Promise<{
  stars: number;
  forks: number;
  issues: number;
  updatedAt?: string;
} | null> {
  try {
    const token = process.env.GITHUB_TOKEN || process.env.NEXT_PUBLIC_GITHUB_TOKEN;
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      stars: data.stargazers_count ?? 0,
      forks: data.forks_count ?? 0,
      issues: data.open_issues_count ?? 0,
      updatedAt: data.updated_at,
    };
  } catch {
    return null;
  }
}

/**
 * Format a number with locale separators.
 */
function formatNumber(n?: number): string {
  if (typeof n !== "number") return "-";
  return new Intl.NumberFormat().format(n);
}

/**
 * Format an ISO datetime into a simple readable date.
 */
function formatDate(iso?: string): string | undefined {
  try {
    if (!iso) return undefined;
    const d = new Date(iso);
    return d.toLocaleDateString();
  } catch {
    return undefined;
  }
}

/**
 * 判断是否为 Contents 分类（大小写无关）。
 */
function isContentsCategory(category?: string): boolean {
  return (category ?? "").trim().toLowerCase() === "contents";
}

/**
 * 粗略识别内容类型：video | pdf | docs | article。
 * Heuristics based on URL host/path.
 */
function detectContentKind(url: string): "video" | "pdf" | "docs" | "article" {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const path = u.pathname.toLowerCase();

    if (host.includes("youtube.com") || host === "youtu.be" || host.includes("vimeo.com")) return "video";
    if (path.endsWith(".pdf")) return "pdf";
    if (host.startsWith("docs.") || path.startsWith("/docs") || path.includes("/guide") || path.includes("/manual") || path.includes("/book")) return "docs";
    return "article";
  } catch {
    return "article";
  }
}

/**
 * 提取可嵌入的 YouTube 播放地址（若可用）。
 */
function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 依据 URL 粗略猜测内容语言。
 */
function detectLanguageFromUrl(url: string): string | undefined {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host.endsWith(".cn")) return "zh";
    if (host.endsWith(".jp")) return "ja";
    if (host.endsWith(".kr")) return "ko";
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Encode a URL to base64url string to use as a safe path segment.
 */
function encodeUrlToId(url: string): string {
  try {
    const b64 = Buffer.from(url, "utf8").toString("base64");
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  } catch {
    return "";
  }
}

/**
 * 构建分享链接（X / LinkedIn）。
 */
function buildShareLinks(title: string, permalink: string, externalUrl: string) {
  const text = encodeURIComponent(`${title} — ${permalink}`);
  return {
    x: `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(externalUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(permalink)}`,
  } as const;
}

/**
 * 在 catalog 树中，根据分类标题（不区分大小写）查找分类节点。
 * 用于将 Contents 下的目录项（如 Platforms）映射到真正的分类。
 */
function findCategoryByTitle(categories: AwesomeCategory[] | undefined, title: string): AwesomeCategory | null {
  if (!Array.isArray(categories) || !title) return null;
  const target = title.trim().toLowerCase();
  const walk = (nodes: AwesomeCategory[]): AwesomeCategory | null => {
    for (const node of nodes) {
      if ((node.title || "").trim().toLowerCase() === target) return node;
      if (Array.isArray(node.children) && node.children.length) {
        const found = walk(node.children);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(categories);
}

/**
 * 将某个分类下的所有链接（包含其子分类）拍平为 AwesomeItem[]。
 */
function flattenCategoryItems(category: AwesomeCategory): AwesomeItem[] {
  const out: AwesomeItem[] = [];
  const walk = (node: AwesomeCategory) => {
    if (Array.isArray(node.items) && node.items.length) out.push(...node.items);
    if (Array.isArray(node.children) && node.children.length) node.children.forEach(walk);
  };
  walk(category);
  return out;
}