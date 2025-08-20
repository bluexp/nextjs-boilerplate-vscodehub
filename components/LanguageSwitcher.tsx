"use client";

import { useI18n, languages, type Language } from "@/lib/i18n";

/**
 * LanguageSwitcher — 客户端语言切换器
 * 在客户端读取/设置语言，并展示可选语言按钮。
 */
export default function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();
  const ordered: Language[] = ["en", "zh", "es", "ja"];

  return (
    <div className="ml-1 inline-flex overflow-hidden rounded-md border border-border/50">
      {ordered.map((lng) => (
        <button
          key={lng}
          onClick={() => setLanguage(lng)}
          className={`px-2 py-1 text-xs ${language === lng ? "bg-accent text-foreground" : "bg-background text-muted-foreground hover:bg-accent/50"}`}
          aria-pressed={language === lng}
        >
          {languages[lng].nativeName}
        </button>
      ))}
    </div>
  );
}