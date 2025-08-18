"use client";

import { CatalogView } from "@/components/CatalogView";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { AwesomeCatalog, AwesomeCategory, AwesomeItem } from "@/types";
import { ChevronRight, Github, Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Flatten all items from a tree of categories into a single array.
 * This acts as a safe fallback when older catalog data lacks the flat `list` field.
 */
function flattenItems(categories: AwesomeCategory[] | undefined): AwesomeItem[] {
  if (!categories || categories.length === 0) return [];
  const out: AwesomeItem[] = [];
  const walk = (cats: AwesomeCategory[]) => {
    for (const c of cats) {
      if (Array.isArray(c.items) && c.items.length) out.push(...c.items);
      if (Array.isArray(c.children) && c.children.length) walk(c.children);
    }
  };
  walk(categories);
  return out;
}

/**
 * Call the server search API to retrieve items that match the query.
 * Server-side search matches title, description, category, and subcategory.
 */
async function searchItemsClient(query: string, limit = 100): Promise<AwesomeItem[]> {
  const url = `/api/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Search request failed: ${res.status}`);
  }
  const json = await res.json();
  if (!json.ok) {
    throw new Error(json.error || "Search API returned error");
  }
  return (json.data?.items || []) as AwesomeItem[];
}

/**
 * Narrow categories to those whose title or any child title matches the query.
 * Returns a subset of the catalog tree for display when item search yields no results.
 */
function filterCategoriesByQuery(tree: AwesomeCategory[] | undefined, query: string): AwesomeCategory[] {
  if (!tree || !query) return [];
  const q = query.toLowerCase();
  const matched: AwesomeCategory[] = [];
  for (const cat of tree) {
    const titleHit = cat.title.toLowerCase().includes(q);
    const matchedChildren = (cat.children || []).filter((ch) => ch.title.toLowerCase().includes(q));
    if (titleHit || matchedChildren.length > 0) {
      // Keep full category for better exploration, but we can optionally narrow children
      matched.push({ ...cat, children: titleHit ? cat.children : matchedChildren });
    }
  }
  return matched;
}

export default function MainPage() {
  const [catalog, setCatalog] = useState<AwesomeCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCatalog, setFilteredCatalog] = useState<
    AwesomeCategory[] | null
  >(null);

  /**
   * Fetch the catalog from the server API to avoid exposing any server-side secrets
   * and to ensure the client always uses the supported contract.
   */
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/catalog", { cache: "no-store" });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Request failed: ${res.status}`);
        }
        const json = await res.json();
        if (!json.ok) {
          throw new Error(json.error || "Unknown API error");
        }
        setCatalog(json.data as AwesomeCatalog);
        setError(null);
      } catch (e: any) {
        setError(e.message || "Failed to load catalog");
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  /**
   * Handle search submission by calling the server search API for more accurate
   * matching (title, description, category, subcategory). Falls back to a local
   * search over the loaded catalog if the API is unavailable.
   */
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) {
      setFilteredCatalog(null);
      return;
    }

    // 1) Try server-side search API for best relevance
    try {
      const items = await searchItemsClient(searchQuery, 100);
      if (items.length > 0) {
        const searchResultCategory: AwesomeCategory = {
          title: `Search Results for "${searchQuery}"`,
          slug: "search-results",
          items,
          children: [],
        };
        setFilteredCatalog([searchResultCategory]);
        return;
      } else {
        // Try category/subcategory title matching as a secondary signal
        const categories = filterCategoriesByQuery(catalog?.tree, searchQuery);
        if (categories.length > 0) {
          setFilteredCatalog(categories);
          return;
        }
        const noResultsCategory: AwesomeCategory = {
          title: `No Results for "${searchQuery}"`,
          slug: "no-results",
          items: [],
          children: [],
        };
        setFilteredCatalog([noResultsCategory]);
        return;
      }
    } catch (err) {
      // 2) Fallback to local search if API fails (e.g., KV not seeded)
      if (!catalog) return;
      const lowerCaseQuery = searchQuery.toLowerCase();
      const allItems = Array.isArray((catalog as any).list) && (catalog as any).list?.length
        ? ((catalog as any).list as AwesomeItem[])
        : flattenItems(catalog.tree);
      const filteredItems = allItems.filter((item) => {
        const hay = [
          item.title,
          item.description,
          item.category,
          item.subcategory,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(lowerCaseQuery);
      });

      if (filteredItems.length > 0) {
        const searchResultCategory: AwesomeCategory = {
          title: `Search Results for "${searchQuery}"`,
          slug: "search-results",
          items: filteredItems,
          children: [],
        };
        setFilteredCatalog([searchResultCategory]);
      } else {
        // Try category/subcategory title matching locally
        const categories = filterCategoriesByQuery(catalog.tree, searchQuery);
        if (categories.length > 0) {
          setFilteredCatalog(categories);
          return;
        }
        const noResultsCategory: AwesomeCategory = {
          title: `No Results for "${searchQuery}"`,
          slug: "no-results",
          items: [],
          children: [],
        };
        setFilteredCatalog([noResultsCategory]);
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b/0 bg-transparent">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-secondary shadow-sm" />
            <span className="hidden text-sm font-semibold tracking-wide text-foreground/90 sm:inline-block">
              vscodehub.com
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            <a
              href="https://github.com/sindresorhus/awesome"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Github className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">Awesome</span>
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative border-b/0 pb-8 pt-10 sm:pt-16">
        <div className="absolute inset-0 -z-10 glass" />
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Daily synced from GitHub Awesome
            </div>
            <h1 className="mt-6 bg-gradient-to-br from-foreground via-foreground/90 to-muted-foreground/80 bg-clip-text text-4xl font-bold leading-tight text-transparent sm:text-5xl">
              A curated, always‑fresh index of developer excellence
            </h1>
            <p className="mt-4 text-balance text-base text-muted-foreground sm:text-lg">
              Browse top categories or search across descriptions to discover the best tools, libraries, and resources.
            </p>

            <form onSubmit={handleSearch} className="mt-6">
              <div className="relative mx-auto flex max-w-xl items-center">
                <Search className="pointer-events-none absolute left-3 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search awesome resources..."
                  className="h-12 w-full rounded-l-md border-input bg-card pl-10 text-base shadow-sm outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ring"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit" className="h-12 rounded-l-none">
                  Search
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </form>

            <div className="mt-4 text-xs text-muted-foreground">
              Try "react", "security", "machine learning" ...
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="flex-1">
        <div className="container relative py-10">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          )}
          {error && (
            <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
              <h4 className="font-semibold">Error</h4>
              <p>{error}</p>
              <p className="text-sm text-muted-foreground">
                Please make sure the server API is reachable and KV environment
                variables are set in a <code>.env.local</code> file.
              </p>
            </div>
          )}
          {catalog && <CatalogView catalog={filteredCatalog ?? catalog.tree} />}
        </div>
      </main>
    </div>
  );
}