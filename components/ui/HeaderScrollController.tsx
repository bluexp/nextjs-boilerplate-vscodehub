"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Header scroll controller that manages global header appearance on scroll.
 * Adds data attributes to header based on page type and scroll position.
 */
export function HeaderScrollController() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;

    // Set home page attribute
    if (isHomePage) {
      header.setAttribute("data-home-page", "");
    } else {
      header.removeAttribute("data-home-page");
    }

    // Only add scroll listener on home page
    if (!isHomePage) {
      header.removeAttribute("data-scrolled");
      return;
    }

    /**
     * Handle scroll events to show/hide header background on home page.
     * Shows background after scrolling past initial viewport height.
     */
    const handleScroll = () => {
      const scrolled = window.scrollY > 100;
      if (scrolled) {
        header.setAttribute("data-scrolled", "");
      } else {
        header.removeAttribute("data-scrolled");
      }
    };

    // Initial check
    handleScroll();

    // Add scroll listener
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isHomePage]);

  return null; // This component only manages side effects
}