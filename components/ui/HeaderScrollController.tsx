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
    const header = document.getElementById("global-header");
    if (!header) return;

    // Set home page attribute
    if (isHomePage) {
      header.setAttribute("data-home-page", "true");
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
     * Uses rAF throttling and triggers after ~80px scroll to reduce visual noise.
     */
    let raf = 0;
    const handleScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const scrolled = window.scrollY > 80;
        if (scrolled) {
          header.setAttribute("data-scrolled", "true");
        } else {
          header.removeAttribute("data-scrolled");
        }
        raf = 0;
      });
    };

    // Initial check
    handleScroll();

    // Add scroll listener
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isHomePage]);

  return null; // This component only manages side effects
}