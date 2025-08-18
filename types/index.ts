/**
 * Represents a link item in the awesome list
 */
export interface AwesomeItem {
  title: string;
  url: string;
  description?: string;
  category: string;
  subcategory?: string;
}

/**
 * Represents a category in the awesome list
 */
export interface AwesomeCategory {
  title: string;
  items: AwesomeItem[];
  subcategories?: {
    [key: string]: AwesomeItem[];
  };
}

/**
 * Represents the full catalog structure
 */
export interface AwesomeCatalog {
  categories: {
    [key: string]: AwesomeCategory;
  };
  meta: {
    updatedAt: string;
    totalItems: number;
    version: number;
  };
}

/**
 * Search result item with highlighting
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