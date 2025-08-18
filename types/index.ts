/**
 * Represents a link item in the awesome list.
 */
export interface AwesomeItem {
  title: string;
  url: string;
  description?: string;
  category: string;
  subcategory?: string;
}

/**
 * Represents a category in the awesome list, which can have nested children.
 */
export interface AwesomeCategory {
  title: string;
  slug: string;
  items: AwesomeItem[];
  children: AwesomeCategory[];
}

/**
 * Represents the full catalog structure with a tree and a flat list.
 */
export interface AwesomeCatalog {
  tree: AwesomeCategory[];
  list: AwesomeItem[];
  meta: {
    updatedAt: string;
    totalItems: number;
    version: number;
  };
}

/**
 * Search result item with highlighting.
 */
export interface SearchResultItem extends AwesomeItem {
  matches?: {
    field: "title" | "description";
    indices: [number, number][];
    value: string;
  }[];
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}