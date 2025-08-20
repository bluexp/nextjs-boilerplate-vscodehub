"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import clsx from "clsx";

import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";

/**
 * ThemeToggle button that switches between light and dark mode.
 * - Uses resolvedTheme to correctly reflect the active theme when default is "system".
 * - Computes icon classes without additional hooks to keep hook order stable across renders.
 * - Adds accessible labels and pressed state for better a11y.
 * - To avoid hydration mismatch, it renders only after client mounts.
 */
export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { t } = useI18n();

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  const sunClasses = clsx(
    "h-[1.2rem] w-[1.2rem] transition-all motion-reduce:transition-none",
    isDark ? "-rotate-90 scale-0" : "rotate-0 scale-100"
  );

  const moonClasses = clsx(
    "absolute h-[1.2rem] w-[1.2rem] transition-all motion-reduce:transition-none",
    isDark ? "rotate-0 scale-100" : "rotate-90 scale-0"
  );

  // Avoid SSR/CSR mismatch by rendering only after mount
  if (!mounted) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-pressed={isDark}
      title={isDark ? t("theme.switchToLight", "Switch to light theme") : t("theme.switchToDark", "Switch to dark theme")}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <Sun className={sunClasses} />
      <Moon className={moonClasses} />
      <span className="sr-only">{t("theme.toggle", "Toggle theme")}</span>
    </Button>
  );
}