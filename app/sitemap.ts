import { getCatalog } from "@/lib/kv";
import type { AwesomeCategory } from "@/types";
import { MetadataRoute } from "next";

/**
 * Recursively flattens a tree of categories into a single array.
 * @param categories The array of categories to flatten.
 * @returns A flat array of all categories and their children.
 */
function getAllCategories(categories: AwesomeCategory[]): AwesomeCategory[] {
  const allCategories: AwesomeCategory[] = [];
  for (const category of categories) {
    allCategories.push(category);
    if (category.children && category.children.length > 0) {
      allCategories.push(...getAllCategories(category.children));
    }
  }
  return allCategories;
}

/**
 * Generate the sitemap for the application using the current catalog.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await getCatalog();
  if (!catalog) {
    return [
      {
        url: "https://vscodehub.com",
        lastModified: new Date(),
      },
    ];
  }

  const allCategories = getAllCategories(catalog.tree);

  const categoriesUrls = allCategories.map((c) => ({
    url: `https://vscodehub.com/categories/${c.slug}`,
    lastModified: new Date(),
  }));

  return [
    {
      url: "https://vscodehub.com",
      lastModified: new Date(),
    },
    ...categoriesUrls,
  ];
}