import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { getCatalog } from "@/lib/kv";
import type { AwesomeCategory } from "@/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryPageClient from "@/components/CategoryPageClient";
import Script from "next/script";

/**
 * Finds a category by its slug in a tree of categories.
 * Safely return undefined when categories is not defined
 */
function findCategory(
  categories: AwesomeCategory[] | undefined,
  slug: string,
): AwesomeCategory | undefined {
  if (!Array.isArray(categories) || categories.length === 0) return undefined;
  for (const category of categories) {
    if (category.slug === slug) {
      return category;
    }
    if (category.children) {
      const found = findCategory(category.children, slug);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}

/**
 * Find the path from the root to the category with the given slug.
 * Returns the full path from root to the target category (or subcategory) for building breadcrumbs.
 */
function findCategoryPath(
  categories: AwesomeCategory[] | undefined,
  slug: string,
  path: AwesomeCategory[] = [],
): AwesomeCategory[] | null {
  if (!Array.isArray(categories) || categories.length === 0) return null;
  for (const category of categories) {
    const nextPath = [...path, category];
    if (category.slug === slug) return nextPath;
    const childPath = findCategoryPath(category.children, slug, nextPath);
    if (childPath) return childPath;
  }
  return null;
}

/**
 * Generates metadata for the category page.
 * Next.js 15 PageProps: params is a Promise; await it inside the function body.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params; // Unpack Promise form of params
  const catalog = await getCatalog();
  if (!catalog || !Array.isArray(catalog.tree)) {
    return {};
  }

  // Use path to get the final category for title/description
  const path = findCategoryPath(catalog.tree, slug);
  const category = path?.[path.length - 1];

  if (!category) {
    return {};
  }

  const title = `${category.title} | VSCodeHub`;
  const description = `A curated list of awesome resources in the ${category.title} category.`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const url = `${siteUrl}/categories/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: `/categories/${slug}` },
    openGraph: {
      title,
      description,
      url: `/categories/${slug}`,
      type: "website",
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(category.title)}`,
          width: 1200,
          height: 630,
          alt: category.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/api/og?title=${encodeURIComponent(category.title)}`],
    },
  };
}

/**
 * The main component for the category page.
 * Next.js 15 PageProps: params is a Promise; await it inside the function body.
 */
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // Unpack Promise form of params
  const catalog = await getCatalog();
  if (!catalog || !Array.isArray(catalog.tree)) {
    notFound();
  }

  // Build full path for breadcrumbs, and derive the current category from it
  const path = findCategoryPath(catalog!.tree, slug);
  const category = path?.[path.length - 1];

  if (!category) {
    notFound();
  }

  const breadcrumbs = [
    { href: "/", label: "Home" },
    // Display the full hierarchy from the root to the current node
    ...path!.map((c) => ({ href: `/categories/${c.slug}`, label: c.title })),
  ];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.label,
      item: `${siteUrl}${b.href}`,
    })),
  };

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category!.title,
    url: `${siteUrl}/categories/${slug}`,
    description: `A curated list of awesome resources in the ${category!.title} category.`,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Script id="ld-breadcrumb" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(breadcrumbLd)}
      </Script>
      <Script id="ld-collection" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(collectionLd)}
      </Script>
      <Breadcrumbs items={breadcrumbs} />
      <header className="my-8 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight">
          {category.title}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {`A curated list of awesome resources in the ${category.title} category.`}
        </p>
      </header>

      <main>
        {/* Client-side filter/sort controls + content rendering */}
        <CategoryPageClient category={category as AwesomeCategory} />
      </main>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>Powered by Next.js and Vercel. Data from Awesome Lists on GitHub.</p>
      </footer>
    </div>
  );
}