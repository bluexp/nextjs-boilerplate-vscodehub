'use client';

import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Breadcrumb {
  href: string;
  label: string;
}

interface BreadcrumbsProps {
  items: Breadcrumb[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            <Link
              href={item.href}
              className="ml-2 text-sm font-medium text-foreground hover:text-primary"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}