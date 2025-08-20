import type { AwesomeCategory, AwesomeItem } from "@/types";
import { Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { memo } from "react";

/**
 * Get the favicon URL from a given URL.
 * Uses Google's public favicon service.
 */
function getFaviconUrl(url: string): string {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch (e) {
    return "";
  }
}

/**
 * Escape special regex characters in a string.
 * Escape special characters in regex to avoid errors when building highlight regex
 */
function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Highlight all case-insensitive matches of query inside the given text using <mark> elements.
 * Use <mark> to highlight case-insensitive matches of the query in the text
 */
function highlightText(text: string, query: string): ReactNode[] {
  if (!query) return [text];
  const pattern = new RegExp(`(${escapeRegExp(query)})`, "ig");
  const parts = text.split(pattern);
  return parts.map((part, idx) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark
        key={idx}
        className="rounded-sm bg-yellow-500/20 px-0.5 [box-shadow:inset_0_0_0_1px_rgba(234,179,8,0.35)]"
      >
        {part}
      </mark>
    ) : (
      <span key={idx}>{part}</span>
    )
  );
}

/**
 * A card component to display an AwesomeItem.
 * Shows title, description, and a link with favicon.
 * Optimize re-render performance with React.memo
 */
/**
 * ItemCard — Desktop hover elevation enhanced for better affordance
 * Functional card: elevate shadow and slightly lift on hover for better affordance on desktop
 */
const ItemCard = memo(function ItemCard({ item, highlightQuery }: { item: AwesomeItem; highlightQuery?: string }) {
  const faviconUrl = getFaviconUrl(item.url);
  return (
    <div className="group relative flex flex-col rounded-xl border border-border/50 bg-card/80 p-0 shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset,0_1px_2px_rgba(0,0,0,0.3)] transition-all hover:-translate-y-0.5 lg:hover:-translate-y-1 hover:shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_10px_20px_rgba(0,0,0,0.25)]">
      <div className="flex flex-1 flex-col p-5">
        {/* Title and link */}
        <h3 className="mb-2 font-semibold tracking-tight text-foreground">
          <Link
            href={`/items/${encodeUrlToId(item.url)}`}
            className="flex items-center gap-2 hover:underline"
          >
            {/* Site icon */}
            {faviconUrl ? (
              <Image
                src={faviconUrl}
                alt={`${item.title} favicon`}
                width={16}
                height={16}
                className="rounded-sm"
              />
            ) : (
              <Globe className="h-4 w-4" />
            )}
            <span className="flex-1">
              {highlightQuery ? highlightText(item.title, highlightQuery) : item.title}
            </span>
            {/* Expand clickable area */}
            <span className="absolute inset-0" />
          </Link>
        </h3>
        {/* Description */}
        {item.description && (
          <p className="text-sm text-muted-foreground">
            {highlightQuery ? highlightText(item.description, highlightQuery) : item.description}
          </p>
        )}
      </div>
    </div>
  );
});

/**
 * A section component to display a category and its items/subcategories.
 * Optimize re-render performance of category grid with React.memo
 */
/**
 * CategorySection — Adds anchor ids for desktop sidebar navigation
 * - Sets id on the section using the category slug (e.g., cat-{slug})
 * - Adds scroll-mt-24 to offset the sticky header when jumping to anchors
 */
const CategorySection = memo(function CategorySection({ category, highlightQuery }: { category: AwesomeCategory; highlightQuery?: string }) {
  const hasContent = (category.items?.length || 0) > 0 || (category.children?.length || 0) > 0;

  return (
    <section id={`cat-${category.slug}`} className="my-12 scroll-mt-24 md:my-14">
      <div className="flex items-center justify-between">
        <h2 className="mb-4 text-2xl font-bold tracking-tight">
          <Link href={`/categories/${category.slug}`}>{category.title}</Link>
        </h2>
      </div>

      {!hasContent ? (
        <div className="rounded-xl border border-border/50 bg-card/70 p-6 text-center text-muted-foreground shadow-sm">
          <p>No items in this category yet.</p>
        </div>
      ) : null}

      {category.children?.map((subCategory) => (
        <div id={`cat-${subCategory.slug}`} key={subCategory.slug} className="ml-0 mt-8 scroll-mt-24 md:ml-4">
          <h3 className="mb-3 text-xl font-semibold">
            <Link href={`/categories/${subCategory.slug}`}>
              {subCategory.title}
            </Link>
          </h3>
          {/* CategorySection — Desktop grid density increased 
              Category grid: increase columns at xl/2xl (4/5 cols) for wide desktop screens */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {subCategory.items?.map((item) => (
              <ItemCard key={item.url} item={item} highlightQuery={highlightQuery} />
            ))}
          </div>
        </div>
      ))}

      {category.items && category.items.length > 0 ? (
        <div className="mt-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {category.items?.map((item) => (
              <ItemCard key={item.url} item={item} highlightQuery={highlightQuery} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
});

/**
 * The main view component for the catalog.
 * Renders a list of categories or a single category view.
 */
function CatalogViewBase({
  catalog,
  category,
  highlightQuery,
}: {
  catalog?: AwesomeCategory[];
  category?: AwesomeCategory;
  highlightQuery?: string;
}) {
  if (category) {
    return <CategorySection category={category} highlightQuery={highlightQuery} />;
  }
  return (
    <>
      {catalog?.map((category) => (
        <CategorySection key={category.slug} category={category} highlightQuery={highlightQuery} />
      ))}
    </>
  );
}

// Add memoization to avoid needless re-renders when props are referentially equal
export const CatalogView = memo(
  CatalogViewBase,
  (prev, next) =>
    prev.category === next.category &&
    prev.highlightQuery === next.highlightQuery &&
    // Shallow compare catalog array identity and its elements' identities for stability
    prev.catalog === next.catalog &&
    (prev.catalog?.length ?? 0) === (next.catalog?.length ?? 0) &&
    (prev.catalog ?? []).every((c, i) => c === (next.catalog ?? [])[i])
);

// Backward-compatible default export
export default CatalogView;

/**
 * Lightweight skeleton card used during loading states
 * Skeleton cards shown while loading
 */
function ItemCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border/50 bg-card/60 p-0">
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-sm bg-muted/50" />
          <div className="h-4 w-40 rounded bg-muted/40" />
        </div>
        <div className="h-3 w-full rounded bg-muted/30" />
        <div className="h-3 w-2/3 rounded bg-muted/30" />
      </div>
    </div>
  );
}

/**
 * A skeleton section for categories while loading
 * Category section skeleton
 */
function CategorySectionSkeleton() {
  return (
    <section className="my-12 md:my-14">
      <div className="mb-4 h-7 w-48 rounded bg-muted/40" />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <ItemCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

/**
 * Encode a URL to base64url string to use as a safe path segment.
 */
/**
 * encodeUrlToId — 在服务端使用 Buffer，在客户端使用 btoa，确保同构安全
 */
function encodeUrlToId(url: string): string {
  try {
    if (typeof window === "undefined") {
      const b64 = Buffer.from(url, "utf8").toString("base64");
      return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    }
    const utf8 = encodeURIComponent(url).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    );
    const b64 = btoa(utf8);
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  } catch {
    return "";
  }
}

/**
 * Exported skeleton view for use by pages while data is loading
 */
export function SkeletonCatalogView({ sections = 3 }: { sections?: number }) {
  return (
    <>
      {Array.from({ length: sections }).map((_, i) => (
        <CategorySectionSkeleton key={i} />
      ))}
    </>
  );
}