import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Footer } from "@/components/ui/Footer";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { HeaderScrollController } from "@/components/ui/HeaderScrollController";
import Link from "next/link";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VSCodeHub — Awesome Catalog",
  description:
    "Curated, always‑fresh index of developer excellence. Explore categories, search, and discover the best resources.",
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
    title: "VSCodeHub — Awesome Catalog",
    siteName: "VSCodeHub",
    description:
      "Curated, always‑fresh index of developer excellence. Explore categories, search, and discover the best resources.",
    images: [
      {
        url: "/api/og?title=VSCodeHub%20%E2%80%94%20Awesome%20Catalog",
        width: 1200,
        height: 630,
        alt: "VSCodeHub — Awesome Catalog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VSCodeHub — Awesome Catalog",
    description:
      "Curated, always‑fresh index of developer excellence. Explore categories, search, and discover the best resources.",
    images: ["/api/og?title=VSCodeHub%20%E2%80%94%20Awesome%20Catalog"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * Global header component with scroll-based transparency on home page.
 * Features brand logo, GitHub link, and theme toggle.
 */
function GlobalHeader() {
  return (
    <header
      id="global-header"
      className="sticky top-0 z-40 w-full border-b border-transparent bg-transparent/0 backdrop-blur-0 transition-all data-[home-page=true]:bg-transparent/0 data-[home-page=true]:backdrop-blur-0 data-[scrolled=true]:bg-background/80 data-[scrolled=true]:backdrop-blur-md data-[scrolled=true]:border-border/50 motion-reduce:transition-none data-[scrolled=true]:shadow-sm"
    >
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Use Next.js Link for internal navigation to avoid full reloads */}
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="select-none">Awesome AI Catalog</span>
          </Link>
          <div className="flex items-center gap-2">
            {/* GitHub */}
            <a
              href="https://github.com/bluexp/nextjs-boilerplate-vscodehub"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open GitHub repository"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 text-sm font-medium transition-colors"
            >
              GitHub
            </a>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Root layout component that wraps all pages with theme provider and global header.
 * Features global theme toggle and consistent layout structure.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Skip link for keyboard users */}
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-1.5 focus:text-primary-foreground focus:shadow-lg"
       >
          Skip to content
        </a>
        {/* Theme provider wraps the entire app */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {/* Control header transparency on homepage */}
          <HeaderScrollController />
          {/* Global Header */}
          <GlobalHeader />
          {/* JSON-LD: WebSite and Organization */}
          <Script id="ld-website" type="application/ld+json" strategy="afterInteractive">
            {JSON.stringify(websiteLd)}
          </Script>
          <Script id="ld-org" type="application/ld+json" strategy="afterInteractive">
            {JSON.stringify(orgLd)}
          </Script>
          {/* Main content area with landmark and target for skip link */}
          <main id="content" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
