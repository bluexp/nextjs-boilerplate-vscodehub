import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Footer } from "@/components/ui/Footer";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { HeaderScrollController } from "@/components/ui/HeaderScrollController";
import Link from "next/link";
import Script from "next/script";
import { I18nProvider } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import HtmlLangUpdater from "@/components/HtmlLangUpdater";
import { createServerTranslator } from "@/lib/i18n-server";

const inter = Inter({ subsets: ["latin"] });

/**
 * generateMetadata — Global fallback metadata with i18n defaults
 * Provides localized title/description and social previews for routes without their own metadata.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await createServerTranslator();
  const localizedTitle = t("metadata.title", "VSCodeHub — Awesome Catalog");
  const localizedDescription = t(
    "metadata.description",
    "Curated, always‑fresh index of developer excellence. Explore categories, search, and discover the best resources.",
  );

  return {
    title: localizedTitle,
    description: localizedDescription,
    keywords: [
      "awesome list",
      "developer tools",
      "libraries",
      "frameworks",
      "resources",
      "VSCodeHub",
      "AI",
    ],
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      url: "/",
      title: localizedTitle,
      siteName: "VSCodeHub",
      description: localizedDescription,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(localizedTitle)}`,
          width: 1200,
          height: 630,
          alt: localizedTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: localizedTitle,
      description: localizedDescription,
      images: [`/api/og?title=${encodeURIComponent(localizedTitle)}`],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * Global header component with scroll-based transparency on home page.
 * Features brand logo, GitHub link, theme toggle, and language switcher.
 */
function GlobalHeader({ t }: { t: (k: string, fb?: string) => string }) {
  return (
    <header
      id="global-header"
      className="sticky top-0 z-40 w-full border-b border-transparent bg-transparent/0 backdrop-blur-0 transition-all data-[home-page=true]:bg-transparent/0 data-[home-page=true]:backdrop-blur-0 data-[scrolled=true]:bg-background/80 data-[scrolled=true]:backdrop-blur-md data-[scrolled=true]:border-border/50 motion-reduce:transition-none data-[scrolled=true]:shadow-sm"
    >
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Use Next.js Link for internal navigation to avoid full reloads */}
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="select-none">{t("header.brand", "Awesome AI Catalog")}</span>
          </Link>
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <LanguageSwitcher />
            {/* GitHub */}
            <a
              href="https://github.com/bluexp/nextjs-boilerplate-vscodehub"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("aria.openGitHubRepo", "Open GitHub repository")}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 text-sm font-medium transition-colors"
            >
              {t("nav.github", "GitHub")}
            </a>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Root layout component that wraps all pages with theme provider, i18n provider, and global header.
 * Features global theme toggle and consistent layout structure.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "VSCodeHub",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "VSCodeHub",
    url: siteUrl,
  };

  // Server-side language detection and translator
  const { language: serverDefaultLang, t } = await createServerTranslator();
 

 
  return (
    <html lang={serverDefaultLang} suppressHydrationWarning>
      <body className={inter.className}>
        <I18nProvider>
          {/* Keep <html lang> in sync on client */}
          <HtmlLangUpdater />
          {/* Skip link for keyboard users */}
          <a
            href="#content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-1.5 focus:text-primary-foreground focus:shadow-lg"
          >
            {t("header.skipToContent", "Skip to content")}
          </a>
          {/* Theme provider wraps the entire app */}
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {/* Control header transparency on homepage */}
            <HeaderScrollController />
            {/* Global Header */}
            <GlobalHeader t={t} />
            {/* JSON-LD: WebSite and Organization */}
            <Script id="ld-website" type="application/ld+json" strategy="afterInteractive">
              {JSON.stringify(websiteLd)}
            </Script>
            <Script id="ld-org" type="application/ld+json" strategy="afterInteractive">
              {JSON.stringify(orgLd)}
            </Script>
            {/* Google AdSense: global script to enable ads on all pages (only in production) */}
            {process.env.NODE_ENV === "production" && (
              <Script
                id="adsbygoogle-init"
                async
                src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2037794469328298"
                crossOrigin="anonymous"
                strategy="beforeInteractive"
              />
            )}
            {/* Main content area with landmark and target for skip link */}
            <main id="content" tabIndex={-1}>
              {children}
            </main>
            <Footer />
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
