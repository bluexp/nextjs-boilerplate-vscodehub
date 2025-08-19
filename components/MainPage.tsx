"use client";

import { CatalogView, SkeletonCatalogView } from "@/components/CatalogView";
// Removed ThemeToggle import after moving to global header
// import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { AwesomeCatalog, AwesomeCategory, AwesomeItem } from "@/types";
import { ChevronRight, Github, Search, Sparkles } from "lucide-react";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import clsx from "clsx";

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

/**
 * Format the updatedAt timestamp for display
 * Format last updated display
 */
function formatUpdatedAt(updatedAt?: string) {
  if (!updatedAt) return undefined;
  const d = new Date(updatedAt);
  if (Number.isNaN(d.getTime())) return updatedAt;
  return d.toLocaleString();
}

/**
 * Compute breadcrumb items for the home page.
 * When there are search results, show Home > Search; otherwise show just Home
 */
function getHomeBreadcrumbItems(searchQuery: string, hasFiltered: boolean) {
  const items = [{ href: "/", label: "Home" }];
  if (hasFiltered && searchQuery.trim()) {
    items.push({ href: "#", label: "Search" });
  }
  return items;
}

/**
 * MainPage - The home component that displays the Awesome catalog
 * Features: real-time search, category browsing, and sidebar navigation
 * Features: real-time search, category browsing, sidebar navigation
 */
export default function MainPage({ initialCatalog }: { initialCatalog?: AwesomeCatalog }) {
  const [catalog, setCatalog] = useState<AwesomeCatalog | null>(initialCatalog ?? null);
  const [loading, setLoading] = useState(!initialCatalog);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCatalog, setFilteredCatalog] = useState<AwesomeCategory[] | null>(null);
  const [suggestions, setSuggestions] = useState<AwesomeItem[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [allItems, setAllItems] = useState<AwesomeItem[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsDebounceRef = useRef<number | null>(null);

  /**
   * Effect: fetch real-time search suggestions with debounce
   * - Triggers when searchQuery changes and length >= 2
   * - Debounce to reduce API calls and flicker
   */
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    if (suggestionsDebounceRef.current) {
      window.clearTimeout(suggestionsDebounceRef.current);
    }
    suggestionsDebounceRef.current = window.setTimeout(async () => {
      try {
        const items = await searchItemsClient(searchQuery, 8);
        setSuggestions(items);
      } catch (e) {
        // ignore suggestions errors silently
      }
    }, 250);
    return () => {
      if (suggestionsDebounceRef.current) {
        window.clearTimeout(suggestionsDebounceRef.current);
      }
    };
  }, [searchQuery]);

  /**
   * Fetch the catalog from the server API to avoid exposing any server-side secrets
   * and to ensure the client always uses the supported contract.
   * If initialCatalog is provided (SSR), skip fetching on mount.
   */
  useEffect(() => {
    if (initialCatalog) return; // SSR already provided data, skip client request
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
  }, [initialCatalog]);

  /**
   * Handle search submission with stable identity to avoid recreating on each render.
   * Use useCallback to memoize handlers and reduce unnecessary re-renders when passing down to children.
   */
  const handleSearch = useCallback(async (e: React.FormEvent) => {
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
  }, [searchQuery, catalog]);

  const breadcrumbs = useMemo(
    () => getHomeBreadcrumbItems(searchQuery, !!filteredCatalog),
    [searchQuery, filteredCatalog]
  );

  // Desktop Sidebar Data — derive current categories to show in the sidebar
  // When a search is active (filteredCatalog), show those sections; otherwise show the root tree
  const sidebarCategories = useMemo(() => (filteredCatalog ?? catalog?.tree ?? []), [filteredCatalog, catalog]);

  /**
   * Effect: implement scrollspy to highlight active sidebar sections
   * Tracks scroll position and highlights the nearest visible section in the sidebar
   */
  useEffect(() => {
    const sections = document.querySelectorAll('[id^="cat-"]');
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the section with the highest intersection ratio that's actually visible
        const visibleSections = entries.filter((entry) => entry.isIntersecting);
        if (visibleSections.length > 0) {
          // Sort by intersection ratio (descending) and pick the most visible one
          const mostVisible = visibleSections.sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          setActiveSection((mostVisible.target as HTMLElement).id);
        }
      },
      {
        rootMargin: "-100px 0px -60% 0px", // Trigger when section is roughly at top 1/3 of viewport
        threshold: [0, 0.1, 0.5],
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
      observer.disconnect();
    };
  }, [filteredCatalog, catalog]);

  /**
   * Build a map of child category slug -> parent category slug.
   * This helps us resolve the "current top-level category" when the active section is a subcategory.
   */
  const childToParentMap = useMemo(() => {
    const map = new Map<string, string>();
    sidebarCategories.forEach((cat) => {
      cat.children?.forEach((sub) => {
        map.set(sub.slug, cat.slug);
      });
    });
    return map;
  }, [sidebarCategories]);

  /**
   * Smoothly scroll the window back to the very top.
   */
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /**
   * Scroll to the current top-level category section.
   * If the active section is a subcategory, it resolves and scrolls to its parent category.
   * If the active section is already a top-level category, it scrolls to that element.
   */
  const scrollToCurrentCategory = useCallback(() => {
    if (!activeSection || !activeSection.startsWith("cat-")) return;
    const currentSlug = activeSection.slice(4);
    const parentSlug = childToParentMap.get(currentSlug);
    const targetSlug = parentSlug ?? currentSlug;
    const el = document.getElementById(`cat-${targetSlug}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeSection, childToParentMap]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header removed: unified into GlobalHeader in RootLayout */}

      {/* Hero */}
      <section className="relative border-b/0 pb-16 pt-16 sm:pb-20 sm:pt-24">
        <div className="absolute inset-0 -z-10 glass" />
        <div className="container mx-auto max-w-7xl px-4 lg:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Daily synced from GitHub Awesome
            </div>
            <h1 className="mt-8 bg-gradient-to-br from-foreground via-foreground/90 to-muted-foreground/80 bg-clip-text text-5xl font-extrabold leading-tight text-transparent sm:text-6xl lg:text-7xl lg:leading-[1.1]">
              A curated, always‑fresh index of developer excellence
            </h1>
            <p className="mt-6 text-balance text-lg text-muted-foreground sm:text-xl">
              Browse top categories or search across descriptions to discover the best tools, libraries, and resources.
            </p>

            <form onSubmit={handleSearch} className="mt-10 lg:mt-12">
              <div className="relative mx-auto flex max-w-2xl items-center lg:max-w-3xl">
                <Search className="pointer-events-none absolute left-4 h-5 w-5 text-muted-foreground lg:left-5 lg:h-6 lg:w-6" />
                {/* Input wrapper that hosts the suggestions dropdown */}
                <div className="relative flex-1">
                  <Input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Search awesome resources..."
                    className="h-14 w-full rounded-l-md border-input bg-card pl-12 text-lg shadow-sm outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ring lg:h-16 lg:pl-14 lg:text-xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSuggestionsOpen(true)}
                    onBlur={() => setTimeout(() => setSuggestionsOpen(false), 120)}
                    aria-describedby="search-shortcut-hint"
                  />

                  {/* Realtime search suggestions dropdown */}
                  {suggestionsOpen && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-md border border-border/50 bg-popover shadow-xl">
                      <ul className="max-h-80 overflow-auto py-1">
                        {suggestions.map((item) => (
                          <li key={item.url}>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block px-3 py-2 hover:bg-accent/50"
                            >
                              <div className="text-sm font-medium text-foreground">{item.title}</div>
                              {item.description && (
                                <div className="text-xs text-muted-foreground line-clamp-2">{item.description}</div>
                              )}
                              {item.category && (
                                <div className="mt-1 text-[11px] text-muted-foreground/80">{item.category}{item.subcategory ? ` · ${item.subcategory}` : ""}</div>
                              )}
                            </a>
                          </li>
                        ))}
                      </ul>
                      <div className="border-t px-3 py-1.5 text-xs text-muted-foreground">Press Enter to run full search</div>
                    </div>
                  )}
                </div>
                <Button type="submit" className="h-14 rounded-l-none px-5 text-base lg:h-16 lg:px-6 lg:text-lg">
                  Search
                  <ChevronRight className="ml-1 h-4 w-4 lg:h-5 lg:w-5" />
                </Button>
              </div>
            </form>

            <div className="mt-4 text-sm text-muted-foreground">
              Try "react", "security", "machine learning" ...
              <span id="search-shortcut-hint" className="ml-2 hidden rounded-full border border-border/50 bg-card px-2 py-0.5 text-xs text-muted-foreground/80 sm:inline-block">Press / or ⌘K</span>
            </div>

            {/* Last updated timestamp (always visible) */}
            <div className="mt-3 text-xs text-muted-foreground">
              {`Last updated: ${formatUpdatedAt(catalog?.meta?.updatedAt) ?? "Unknown"}`}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="flex-1">
        <div className="container mx-auto max-w-7xl px-4 py-12 lg:px-6">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <Breadcrumbs items={breadcrumbs} />
          </div>

          {/* Desktop Sidebar + Main content layout */}
          <div className="grid grid-cols-12 gap-6 lg:gap-10">
            {/* Sidebar — desktop-only anchor navigation for quick jumps */}
            <aside className="sticky top-24 col-span-3 hidden max-h-[calc(100vh-10rem)] overflow-y-auto pr-4 lg:block">
              {/* Quick actions: Back to top / Back to current category */}
              <div className="mb-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={scrollToTop} aria-label="Back to top">
                  {/* icon inserted via lucide-react */}
                  <svg className="mr-1 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 15l7-7 7 7"/><path d="M12 8v13"/></svg>
                  Top
                </Button>
                <Button variant="ghost" size="sm" onClick={scrollToCurrentCategory} disabled={!activeSection} aria-label="Back to current category">
                  {/* icon inserted via lucide-react */}
                  <svg className="mr-1 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
                  Current Category
                </Button>
              </div>
              <nav aria-label="Catalog Sections" className="space-y-3 text-sm">
                {sidebarCategories.map((cat) => (
                  <div key={cat.slug} className="rounded-lg border border-border/40 bg-card/50 p-3 shadow-sm">
                    <a 
                      href={`#cat-${cat.slug}`} 
                      className={clsx(
                        "block truncate font-medium transition-colors",
                        activeSection === `cat-${cat.slug}` 
                          ? "text-primary" 
                          : "text-foreground hover:text-primary"
                      )}
                    >
                      {cat.title}
                    </a>
                    {cat.children && cat.children.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {cat.children.map((sub) => (
                          <a
                            key={sub.slug}
                            href={`#cat-${sub.slug}`}
                            className={clsx(
                              "block truncate transition-colors",
                              activeSection === `cat-${sub.slug}`
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {sub.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </aside>

            {/* Main column */}
            <div className="col-span-12 lg:col-span-9">
              {loading && (
                <SkeletonCatalogView sections={3} />
              )}
              {!loading && error && (
                <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
                  <h4 className="font-semibold">Error</h4>
                  <p>{error}</p>
                  <p className="text-sm text-muted-foreground">
                    Please make sure the server API is reachable and KV environment
                    variables are set in a <code>.env.local</code> file.
                  </p>
                </div>
              )}
              {!loading && catalog && (
                <CatalogView catalog={filteredCatalog ?? catalog.tree} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}