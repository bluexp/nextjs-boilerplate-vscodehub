"use client";

import { useMemo, useState } from "react";
import type { AwesomeCategory, AwesomeItem } from "@/types";
import { CatalogView } from "@/components/CatalogView";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ChevronRight, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/**
 * Perform a case-insensitive match for a query against an item's text fields.
 * Performs case-insensitive matching on title and description.
 */
function itemMatchesQuery(item: AwesomeItem, q: string): boolean {
  if (!q) return true;
  const hay = `${item.title} ${item.description ?? ""}`.toLowerCase();
  return hay.includes(q.toLowerCase());
}

/**
 * Sort items by the given key.
 * Supports default order and alphabetical A→Z.
 */
function sortItems(items: AwesomeItem[], sort: "default" | "alpha"): AwesomeItem[] {
  if (sort === "alpha") {
    return [...items].sort((a, b) => a.title.localeCompare(b.title));
  }
  return items;
}

/**
 * Filter and sort a category deeply, returning a new object without mutating the original.
 * Deeply filter and sort categories while keeping the original data immutable.
 */
function buildFilteredCategory(
  category: AwesomeCategory,
  query: string,
  sort: "default" | "alpha",
): AwesomeCategory {
  // Filter and sort top-level items
  const filteredTopItems = sortItems(
    (category.items ?? []).filter((it) => itemMatchesQuery(it, query)),
    sort,
  );

  // Filter and sort children
  const filteredChildren = (category.children ?? [])
    .map((child) => {
      const items = sortItems(
        (child.items ?? []).filter((it) => itemMatchesQuery(it, query)),
        sort,
      );
      const nextChildren = (child.children ?? []).map((gchild) => {
        const it = sortItems(
          (gchild.items ?? []).filter((i) => itemMatchesQuery(i, query)),
          sort,
        );
        return { ...gchild, items: it } as AwesomeCategory;
      });
      return { ...child, items, children: nextChildren } as AwesomeCategory;
    })
    // When there is a query, drop empty subcategories to avoid blank sections
    .filter((c) => (query ? (c.items?.length || 0) + (c.children?.length || 0) > 0 : true));

  return {
    ...category,
    items: filteredTopItems,
    children: filteredChildren,
  };
}

/**
 * Category page client component with local filter and sort controls.
 * Provides in-page filtering and sorting controls for better UX.
 */
export default function CategoryPageClient({ category }: { category: AwesomeCategory }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"default" | "alpha">("default");
  const { t } = useI18n();

  const filtered = useMemo(() => buildFilteredCategory(category, query, sort), [category, query, sort]);

  return (
    <div className="space-y-6">
      {/* Controls bar */}
      <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-border/50 bg-card/60 p-4 shadow-sm md:flex-row md:items-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          className="flex w-full items-center gap-2 md:w-auto"
        >
          <div className="relative flex-1 md:min-w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("category.searchPlaceholder", "Search within this category...")}
              className="pl-9"
            />
          </div>
          <Button type="submit" className="whitespace-nowrap">
            {t("category.filter", "Filter")}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-muted-foreground">
            {t("category.sort", "Sort")}
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="h-9 rounded-md border border-border/60 bg-card px-3 text-sm outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="default">{t("category.sortDefault", "Default order")}</option>
            <option value="alpha">{t("category.sortAlpha", "Title A→Z")}</option>
          </select>
        </div>
      </div>

      {/* Category content */}
      <CatalogView catalog={[filtered]} highlightQuery={query} />
    </div>
  );
}