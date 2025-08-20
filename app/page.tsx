import MainPage from "@/components/MainPage";
import { getCatalog } from "@/lib/kv";
import type { Metadata } from "next";
import Script from "next/script";
import { createServerTranslator } from "@/lib/i18n-server";
import type { Language } from "@/lib/i18n";

/**
 * Home page server component.
 * Prefetch catalog on the server to reduce first-load flicker and pass as initialCatalog to the client component.
 * Also selects a random hero tagline on each request to display one of several variants per refresh.
 */

/**
 * generateMetadata — Home page metadata with i18n
 * Returns localized title/description using server-side translator to avoid client hooks on the server.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await createServerTranslator("en" as Language);
  return {
    title: t("metadata.title", "VSCodeHub — Awesome Catalog"),
    description: t(
      "metadata.description",
      "Curated, always‑fresh index of developer excellence. Explore categories, search, and discover the best resources.",
    ),
    alternates: { canonical: "/" },
  };
}

export default async function Home() {
  const catalog = await getCatalog();

  // Localize hero tagline variants — one is randomly selected per request
  const { t } = await createServerTranslator("en" as Language);
  const taglines = [
    t("hero.tagline.default", "A curated, always‑fresh index of developer excellence"),
    t("hero.tagline.alt1", "Discover the best tools, libraries, and resources — curated daily"),
    t("hero.tagline.alt2", "Your gateway to top developer resources and insights"),
    t("hero.tagline.alt3", "Explore high‑quality frameworks, libraries, and guides in one place"),
    t("hero.tagline.alt4", "A living, ever‑growing index of the very best in software development"),
  ];
  const randomIndex = Math.floor(Math.random() * taglines.length);
  const heroTagline = taglines[randomIndex];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const webpageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("metadata.title", "VSCodeHub — Awesome Catalog"),
    url: siteUrl,
    description: t(
      "metadata.description",
      "Curated, always‑fresh index of developer excellence. Explore categories, search, and discover the best resources.",
    ),
  };

  return (
    <>
      <Script id="ld-home" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(webpageLd)}
      </Script>
      <MainPage initialCatalog={catalog ?? undefined} heroTagline={heroTagline} />
    </>
  );
}
