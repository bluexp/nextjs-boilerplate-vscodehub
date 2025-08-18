import type { AwesomeCategory, AwesomeItem } from "@/types";
import { Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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
 * A card component to display an AwesomeItem.
 * Shows title, description, and a link with favicon.
 */
function ItemCard({ item }: { item: AwesomeItem }) {
  const faviconUrl = getFaviconUrl(item.url);
  return (
    <div className="group relative flex flex-col rounded-xl border border-border/50 bg-card/80 p-0 shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset,0_1px_2px_rgba(0,0,0,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_10px_20px_rgba(0,0,0,0.25)]">
      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-2 font-semibold tracking-tight text-foreground">
          <Link
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:underline"
          >
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
            <span className="flex-1">{item.title}</span>
            <span className="absolute inset-0" />
          </Link>
        </h3>
        {item.description && (
          <p className="text-sm text-muted-foreground">{item.description}</p>
        )}
      </div>
    </div>
  );
}

/**
 * A section component to display a category and its items/subcategories.
 */
function CategorySection({ category }: { category: AwesomeCategory }) {
  const hasContent = (category.items?.length || 0) > 0 || (category.children?.length || 0) > 0;

  return (
    <section className="my-10">
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
        <div key={subCategory.slug} className="ml-0 mt-6 md:ml-4">
          <h3 className="mb-3 text-xl font-semibold">
            <Link href={`/categories/${subCategory.slug}`}>
              {subCategory.title}
            </Link>
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subCategory.items?.map((item) => (
              <ItemCard key={item.url} item={item} />
            ))}
          </div>
        </div>
      ))}

      {category.items && category.items.length > 0 ? (
        <div className="mt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {category.items?.map((item) => (
              <ItemCard key={item.url} item={item} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

/**
 * The main view component for the catalog.
 * Renders a list of categories or a single category view.
 */
export function CatalogView({
  catalog,
  category,
}: {
  catalog?: AwesomeCategory[];
  category?: AwesomeCategory;
}) {
  if (category) {
    return <CategorySection category={category} />;
  }
  return (
    <>
      {catalog?.map((category) => (
        <CategorySection key={category.slug} category={category} />
      ))}
    </>
  );
}