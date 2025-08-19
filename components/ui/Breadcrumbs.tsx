'use client';

import Link from "next/link";
import { ChevronRight, Home, Search, Folder } from "lucide-react";
import type { ComponentType } from "react";
import { memo, useMemo } from "react";

interface Breadcrumb {
  href: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
}

interface BreadcrumbsProps {
  items: Breadcrumb[];
  className?: string;
}

/**
 * Enhanced breadcrumb navigation component with dynamic icons and improved accessibility.
 * Uses React.memo and useMemo to avoid unnecessary re-renders.
 */
export const Breadcrumbs = memo(function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  // Auto-assign icons based on label or position; memoized to avoid recalculation when items unchanged
  const enhancedItems = useMemo(() => {
    return items.map((item, index) => {
      if (item.icon) return item;

      // Auto-assign icons based on common patterns
      if (index === 0 || item.label === "Home" || item.href === "/") {
        return { ...item, icon: Home };
      }
      if (item.label === "Search" || item.label.includes("Search")) {
        return { ...item, icon: Search };
      }
      // Default category icon for other items
      return { ...item, icon: Folder };
    });
  }, [items]);

  return (
    <nav aria-label="Breadcrumb" className={`mb-4 ${className ?? ""}`}>
      <ol
        className="flex items-center space-x-1 text-sm text-muted-foreground"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {enhancedItems.map((item, index) => {
          const isLast = index === enhancedItems.length - 1;
          const IconComponent = item.icon;

          return (
            <li
              key={`${item.href}-${index}`}
              className="flex items-center"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {index > 0 && (
                <ChevronRight
                  className="mx-2 h-4 w-4 text-muted-foreground/60"
                  aria-hidden="true"
                />
              )}

              {isLast ? (
                // Last item - current page (not clickable)
                <span
                  className="flex items-center gap-1.5 text-sm font-medium text-foreground"
                  aria-current="page"
                >
                  {/* Provide item URL for microdata even when not a link */}
                  <meta itemProp="item" content={item.href} />
                  {IconComponent && (
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span itemProp="name">{item.label}</span>
                </span>
              ) : (
                // Clickable breadcrumb links
                <Link
                  href={item.href}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:bg-accent focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  itemProp="item"
                >
                  {IconComponent && <IconComponent className="h-4 w-4" />}
                  <span itemProp="name">{item.label}</span>
                </Link>
              )}

              {/* Position of this breadcrumb in the list */}
              <meta itemProp="position" content={String(index + 1)} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
});