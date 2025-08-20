"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Available languages in the application.
 */
export type Language = "en" | "zh" | "es" | "ja";

/**
 * Language configuration for the application.
 */
export const languages: Record<Language, { name: string; nativeName: string; flag: string }> = {
  en: { name: "English", nativeName: "English", flag: "🇺🇸" },
  zh: { name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  es: { name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  ja: { name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
};

/**
 * Default language.
 */
export const defaultLanguage: Language = "en";

/**
 * Context for managing i18n state.
 */
interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

/**
 * Hook to access i18n context.
 */
export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

/**
 * I18n Provider component that manages language state and provides translation function.
 * Features localStorage persistence and automatic language detection.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);

  /**
   * Load translations for the current language.
   */
  const loadTranslations = async (lang: Language) => {
    try {
      const mod = await import(`@/locales/${lang}.json`);
      setTranslations(mod.default || {});
    } catch (error) {
      console.warn(`Failed to load translations for language: ${lang}`, error);
      setTranslations({});
    }
  };

  /**
   * Set language and persist to localStorage and cookies.
   * Cookie is set for server-side language detection.
   */
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("language", lang);
      // Set cookie for server-side detection (expires in 1 year)
      document.cookie = `language=${lang}; path=/; max-age=31536000; samesite=lax`;
    }
    loadTranslations(lang);
  };

  /**
   * interpolate — Simple string interpolation helper
   * Replaces occurrences of `{key}` in a string using provided variables.
   */
  function interpolate(template: string, vars?: Record<string, string | number>): string {
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (_, k: string) =>
      Object.prototype.hasOwnProperty.call(vars, k) && vars[k] !== undefined ? String(vars[k]) : `{${k}}`
    );
  }

  /**
   * Translation function that returns the translated string or fallback.
   * Supports optional variable interpolation when the translation contains placeholders like `{query}`.
   */
  const t = (key: string, fallback?: string, vars?: Record<string, string | number>): string => {
    const base = translations[key] || fallback || key;
    return interpolate(base, vars);
  };

  /**
   * Initialize language from localStorage or browser preferences.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    let savedLanguage = localStorage.getItem("language") as Language | null;

    // If no saved language, detect from browser
    if (!savedLanguage || !Object.keys(languages).includes(savedLanguage)) {
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith("zh")) {
        savedLanguage = "zh";
      } else if (browserLang.startsWith("es")) {
        savedLanguage = "es";
      } else if (browserLang.startsWith("ja")) {
        savedLanguage = "ja";
      } else {
        savedLanguage = "en";
      }
    }

    setLanguageState(savedLanguage);
    loadTranslations(savedLanguage);
    setMounted(true);
  }, []);

  // Don't render children until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Get the language direction (LTR or RTL) for a given language.
 * Currently all supported languages are LTR.
 */
export function getLanguageDirection(lang: Language): "ltr" | "rtl" {
  // All current languages are left-to-right
  return "ltr";
}

/**
 * Get the HTML lang attribute value for a given language.
 */
export function getHtmlLangAttribute(lang: Language): string {
  const langMap: Record<Language, string> = {
    en: "en",
    zh: "zh-CN",
    es: "es",
    ja: "ja",
  };
  return langMap[lang] || "en";
}