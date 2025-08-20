"use client";

import { useEffect } from "react";
import { useI18n, getHtmlLangAttribute } from "@/lib/i18n";

/**
 * HtmlLangUpdater — 客户端 HTML 语言属性同步器
 * 监听当前语言变化并更新 document.documentElement.lang。
 */
export default function HtmlLangUpdater() {
  const { language } = useI18n();

  useEffect(() => {
    document.documentElement.lang = getHtmlLangAttribute(language);
  }, [language]);

  return null;
}