import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { getCatalog } from "@/lib/kv";
import type { AwesomeCategory } from "@/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/CatalogView";

/**
 * Props for the category page.
 */
interface CategoryPageProps {
  params: {
    slug: string;
  };
}

/**
 * Finds a category by its slug in a tree of categories.
 * @param categories The categories to search through.
 * @param slug The slug of the category to find.
 * @returns The found category or undefined.
 */
function findCategory(
  categories: AwesomeCategory[],
  slug: string,
): AwesomeCategory | undefined {
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
 * Generates metadata for the category page.
 * @param params The page parameters, including the slug.
 */
export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const catalog = await getCatalog();
  if (!catalog) {
    return {};
  }

  const category = findCategory(catalog.tree, params.slug);

  if (!category) {
    return {};
  }

  return {
    title: `${category.title} | Awesome List`,
    description: `A curated list of awesome things in the ${category.title} category.`,
  };
}

/**
 * The main component for the category page.
 * @param params The page parameters, including the slug.
 */
export default async function CategoryPage({ params }: CategoryPageProps) {
  const catalog = await getCatalog();
  if (!catalog) {
    notFound();
  }

  const category = findCategory(catalog.tree, params.slug);

  if (!category) {
    notFound();
  }

  const breadcrumbs = [
    { href: "/", label: "Home" },
    { href: `/categories/${params.slug}`, label: category.title },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={breadcrumbs} />
      <header className="my-8 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight">
          {category.title}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {`A curated list of awesome things in the ${category.title} category.`}
        </p>
      </header>

      <main>
        <CatalogView catalog={[category]} />
      </main>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>Powered by Next.js and Vercel. Data from Awesome Lists on GitHub.</p>
      </footer>
    </div>
  );
}