import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Footer } from "@/components/ui/Footer";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Github } from "lucide-react";
import { HeaderScrollController } from "@/components/ui/HeaderScrollController";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VSCodeHub — Awesome Catalog",
  description:
    "Curated, always‑fresh index of developer excellence. Explore categories, search, and discover the best resources.",
};

/**
 * Global header component with scroll-based transparency on home page.
 * Features brand logo, GitHub link, and theme toggle.
 */
function GlobalHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm transition-all duration-200 
                     data-[home-page]:border-transparent data-[home-page]:bg-transparent 
                     data-[home-page]:backdrop-blur-none data-[home-page]:supports-[backdrop-filter]:bg-background/0
                     data-[scrolled]:border-border/50 data-[scrolled]:bg-background/80 data-[scrolled]:backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl px-4 lg:px-6">
        <div className="flex h-14 items-center justify-between">
          <a href="/" className="flex items-center gap-2 transition-colors hover:opacity-80">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-secondary shadow-sm" />
            <span className="hidden text-sm font-semibold tracking-wide text-foreground/90 sm:inline-block">
              vscodehub.com
            </span>
          </a>
          
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/sindresorhus/awesome"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">Awesome</span>
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
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <HeaderScrollController />
          <GlobalHeader />
          
          {/* Each page renders its own breadcrumbs: see MainPage and CategoryPage */}
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
