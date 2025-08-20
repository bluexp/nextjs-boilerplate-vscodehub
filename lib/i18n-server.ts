import type { Language } from "./i18n";
import { languages } from "./i18n";

/**
 * Server-side internationalization utilities
 * 服务器端国际化工具 - 用于在服务器组件中获取翻译
 */

/**
 * Load translation file for a specific language
 * 为指定语言加载翻译文件
 */
async function loadTranslations(lang: Language): Promise<Record<string, string>> {
  try {
    const mod = await import(`@/locales/${lang}.json`);
    return mod.default;
  } catch (error) {
    console.warn(`Failed to load translations for ${lang}, falling back to English`);
    try {
      const mod = await import(`@/locales/en.json`);
      return mod.default;
    } catch {
      return {};
    }
  }
}

/**
 * Get translation for a key with fallback support
 * 获取翻译值，支持回退机制
 */
function getTranslation(
  translations: Record<string, string>,
  key: string,
  fallback?: string
): string {
  return translations[key] || fallback || key;
}

/**
 * Server-side translation function factory
 * 服务器端翻译函数工厂
 */
export async function createServerTranslator(lang: Language = "en") {
  const translations = await loadTranslations(lang);
  
  return {
    t: (key: string, fallback?: string) => getTranslation(translations, key, fallback),
    language: lang,
    availableLanguages: Object.keys(languages) as Language[],
  };
}

/**
 * Simple server-side translation helper for metadata and static content
 * 简单的服务器端翻译助手，用于元数据和静态内容
 */
export async function getServerTranslation(
  key: string,
  lang: Language = "en",
  fallback?: string
): Promise<string> {
  const translations = await loadTranslations(lang);
  return getTranslation(translations, key, fallback);
}