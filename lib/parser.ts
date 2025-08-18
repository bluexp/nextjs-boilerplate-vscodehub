import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root, Heading, List, ListItem, Paragraph, Link, Text } from "mdast";
import type { AwesomeCatalog, AwesomeCategory, AwesomeItem } from "../types";

/**
 * Parse a markdown string into an AST using remark
 */
async function parseMarkdown(content: string): Promise<Root> {
  const processor = unified().use(remarkParse).use(remarkGfm);
  const ast = await processor.parse(content);
  return ast;
}

/**
 * Extract text content from a node that might contain nested text nodes
 */
function extractText(node: any): string {
  if (node.type === "text") return node.value;
  if (node.children?.length) {
    return node.children.map(extractText).join("");
  }
  return "";
}

/**
 * Parse a list item node into an AwesomeItem
 */
function parseListItem(item: ListItem, category: string, subcategory?: string): AwesomeItem | null {
  const paragraph = item.children[0] as Paragraph;
  if (!paragraph || !paragraph.children?.length) return null;

  const link = paragraph.children.find((n): n is Link => n.type === "link");
  if (!link?.url) return null;

  const title = link.children.map(extractText).join("").trim();
  if (!title) return null;

  // Description is any text after the link
  const descNodes = paragraph.children.slice(
    paragraph.children.findIndex((n) => n === link) + 1
  );
  const description = descNodes
    .map(extractText)
    .join("")
    .replace(/^[—-]\s*/, "")
    .trim();

  return {
    title,
    url: link.url,
    description: description || undefined,
    category,
    subcategory,
  };
}

/**
 * Parse the awesome-list markdown content into a structured catalog
 */
export async function parseAwesomeList(content: string): Promise<AwesomeCatalog> {
  const ast = await parseMarkdown(content);
  const categories: { [key: string]: AwesomeCategory } = {};
  
  let currentCategory = "";
  let currentSubcategory: string | undefined;

  // Walk through the AST
  for (const node of ast.children) {
    // New category starts with a heading
    if (node.type === "heading" && node.depth === 2) {
      currentCategory = extractText(node).trim();
      if (currentCategory && !categories[currentCategory]) {
        categories[currentCategory] = {
          title: currentCategory,
          items: [],
          subcategories: {},
        };
      }
      currentSubcategory = undefined;
      continue;
    }

    // Subcategory is a level-3 heading
    if (node.type === "heading" && node.depth === 3) {
      currentSubcategory = extractText(node).trim();
      if (currentCategory && currentSubcategory) {
        const cat = categories[currentCategory];
        if (cat && !cat.subcategories![currentSubcategory]) {
          cat.subcategories![currentSubcategory] = [];
        }
      }
      continue;
    }

    // Items are in lists
    if (node.type === "list" && currentCategory) {
      for (const item of node.children) {
        const parsed = parseListItem(item, currentCategory, currentSubcategory);
        if (!parsed) continue;

        const category = categories[currentCategory];
        if (!category) continue;

        if (currentSubcategory) {
          category.subcategories![currentSubcategory].push(parsed);
        } else {
          category.items.push(parsed);
        }
      }
    }
  }

  // Count total items
  let totalItems = 0;
  for (const cat of Object.values(categories)) {
    totalItems += cat.items.length;
    if (cat.subcategories) {
      for (const items of Object.values(cat.subcategories)) {
        totalItems += items.length;
      }
    }
  }

  return {
    categories,
    meta: {
      updatedAt: new Date().toISOString(),
      totalItems,
      version: 1,
    },
  };
}

/**
 * Simple search implementation across items
 */
export function searchItems(
  catalog: AwesomeCatalog,
  query: string,
  limit = 20
): AwesomeItem[] {
  const results: AwesomeItem[] = [];
  const terms = query.toLowerCase().split(/\s+/);

  for (const category of Object.values(catalog.categories)) {
    // Search in main items
    for (const item of category.items) {
      if (matchesSearch(item, terms)) {
        results.push(item);
      }
    }

    // Search in subcategories
    if (category.subcategories) {
      for (const [subcat, items] of Object.entries(category.subcategories)) {
        for (const item of items) {
          if (matchesSearch(item, terms)) {
            results.push(item);
          }
        }
      }
    }

    if (results.length >= limit) break;
  }

  return results.slice(0, limit);
}

/**
 * Check if an item matches all search terms
 */
function matchesSearch(item: AwesomeItem, terms: string[]): boolean {
  const text = [
    item.title,
    item.description,
    item.category,
    item.subcategory,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return terms.every((term) => text.includes(term));
}