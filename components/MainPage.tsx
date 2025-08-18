"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { AwesomeCatalog, AwesomeCategory, AwesomeItem } from "@/types";

/**
 * Renders a single item in the list.
 * @param item The item to render.
 */
const ItemCard = ({ item }: { item: AwesomeItem }) => (
  <div className="mb-4 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-primary hover:underline"
    >
      {item.title}
    </a>
    {item.description && <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>}
  </div>
);

/**
 * Renders a category section with its items.
 * @param category The category to render.
 */
const CategorySection = ({ category }: { category: AwesomeCategory }) => (
  <section className="mb-8">
    <h2 className="mb-4 text-2xl font-bold tracking-tight">{category.title}</h2>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {category.items.map((item) => (
        <ItemCard key={item.url} item={item} />
      ))}
      {category.subcategories &&
        Object.values(category.subcategories).map((subCategoryItems) =>
          subCategoryItems.map((item) => <ItemCard key={item.url} item={item} />)
        )}
    </div>
  </section>
);

/**
 * The main page component, including search and catalog display.
 */
export default function MainPage() {
  const [catalog, setCatalog] = useState<AwesomeCatalog | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AwesomeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await fetch("/api/catalog");
        const data = await res.json();
        if (data.ok) {
          setCatalog(data.data);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.ok) {
        setSearchResults(data.data.items);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  if (isLoading) {
    return <div className="text-center">Loading catalog...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  const itemsToDisplay = searchQuery.trim() ? searchResults : null;

  return (
    <div className="container mx-auto p-4">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold">Awesome List</h1>
        <p className="text-muted-foreground">A curated list of awesome things.</p>
      </header>

      <form onSubmit={handleSearch} className="mb-8 flex w-full max-w-2xl mx-auto">
        <Input
          type="search"
          placeholder="Search for awesome things..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-grow"
        />
        <Button type="submit" className="ml-2">Search</Button>
      </form>

      {itemsToDisplay ? (
        <section>
          <h2 className="mb-4 text-2xl font-bold">Search Results</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {itemsToDisplay.map((item) => (
              <ItemCard key={item.url} item={item} />
            ))}
          </div>
        </section>
      ) : (
        catalog && Object.values(catalog.categories).map((category) => (
          <CategorySection key={category.title} category={category} />
        ))
      )}
    </div>
  );
}