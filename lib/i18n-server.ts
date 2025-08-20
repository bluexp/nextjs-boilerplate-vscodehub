import type { Language } from "./i18n";
import { languages } from "./i18n";
import { headers, cookies } from "next/headers";

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
 * Detect language from server-side sources (cookies and Accept-Language headers)
 * 从服务器端源（cookie 和 Accept-Language 头部）推断语言
 */
export async function detectServerLanguage(): Promise<Language> {
  try {
    // First, check for saved language in cookies
    const cookieStore = await cookies();
    const savedLang = cookieStore.get("language")?.value;

    // Validate saved language is supported
    if (savedLang && Object.prototype.hasOwnProperty.call(languages, savedLang)) {
      return savedLang as Language;
    }

    // Fall back to Accept-Language header
    const headersList = await headers();
    const acceptLanguage: string | null = headersList.get("accept-language");

    if (acceptLanguage) {
      // Parse Accept-Language header (e.g., "zh-CN,zh;q=0.9,en;q=0.8")
      const languageRanges: { code: string; quality: number }[] = acceptLanguage
        .toLowerCase()
        .split(",")
        .map((langRange: string) => {
          const [code, qValue] = langRange.trim().split(";q=");
          return {
            code: code.split("-")[0], // Extract primary language (zh-CN -> zh)
            quality: qValue ? parseFloat(qValue) : 1.0,
          };
        })
        .sort((a: { quality: number }, b: { quality: number }) => b.quality - a.quality); // Sort by quality descending

      // Find first supported language
      for (const entry of languageRanges) {
        const code = entry.code;
        if (Object.prototype.hasOwnProperty.call(languages, code)) {
          return code as Language;
        }
      }
    }
  } catch (error) {
    console.warn("Failed to detect server language:", error);
  }

  // Default to English if detection fails
  return "en";
}

/**
 * Server-side translation function factory
 * 服务器端翻译函数工厂
 */
export async function createServerTranslator(lang?: Language) {
  const detectedLang = lang || (await detectServerLanguage());
  const translations = await loadTranslations(detectedLang);

  return {
    t: (key: string, fallback?: string) => getTranslation(translations, key, fallback),
    language: detectedLang,
    availableLanguages: Object.keys(languages) as Language[],
  };
}

/**
 * Simple server-side translation helper for metadata and static content
 * 简单的服务器端翻译助手，用于元数据和静态内容
 */
export async function getServerTranslation(
  key: string,
  lang?: Language,
  fallback?: string
): Promise<string> {
  const detectedLang = lang || (await detectServerLanguage());
  const translations = await loadTranslations(detectedLang);
  return getTranslation(translations, key, fallback);
}