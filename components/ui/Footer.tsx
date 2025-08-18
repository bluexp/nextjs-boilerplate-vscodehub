import { Github, Heart, ExternalLink } from "lucide-react";
import Link from "next/link";

/**
 * Global footer component with copyright, attribution, and links
 * 全站页脚组件，包含版权信息、数据来源致谢和相关链接
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-border/50 bg-card/30">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* 品牌信息 */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-secondary shadow-sm" />
              <span className="text-lg font-semibold text-foreground">
                vscodehub.com
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              开发者资源导航站，精选优质工具与库
            </p>
          </div>

          {/* 数据来源致谢 */}
          <div className="flex flex-col space-y-3">
            <h3 className="text-sm font-semibold text-foreground">数据来源</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                <span>基于</span>
                <Link
                  href="https://github.com/sindresorhus/awesome"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Awesome Lists
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <p>遵循 CC0-1.0 许可证，每日自动同步</p>
            </div>
          </div>

          {/* 相关链接 */}
          <div className="flex flex-col space-y-3">
            <h3 className="text-sm font-semibold text-foreground">相关链接</h3>
            <div className="space-y-2 text-sm">
              <Link
                href="https://github.com/sindresorhus/awesome"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Github className="h-4 w-4" />
                Awesome 项目
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Link
                href="/api/admin/sync"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                数据同步状态
              </Link>
              <Link
                href="/sitemap.xml"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                网站地图
              </Link>
            </div>
          </div>
        </div>

        {/* 版权信息 */}
        <div className="mt-8 flex flex-col items-center justify-between border-t border-border/30 pt-6 text-sm text-muted-foreground md:flex-row">
          <p>
            © {currentYear} vscodehub.com. Built with{" "}
            <Link
              href="https://nextjs.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Next.js
            </Link>{" "}
            and deployed on{" "}
            <Link
              href="https://vercel.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Vercel
            </Link>
            .
          </p>
          <p className="mt-2 md:mt-0">
            致敬所有开源贡献者 🚀
          </p>
        </div>
      </div>
    </footer>
  );
}