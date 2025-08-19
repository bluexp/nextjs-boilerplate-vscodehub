import MainPage from "@/components/MainPage";
import { getCatalog } from "@/lib/kv";
import type { Metadata } from "next";
import Script from "next/script";

/**
 * Home page server component.
 * Prefetch catalog on the server to reduce first-load flicker and pass as initialCatalog to the client component.
 * Also selects a random hero tagline on each request to display one of several variants per refresh.
 */

export const metadata: Metadata = {
  title: "VSCodeHub — Awesome Catalog",
  description:
    "Curated, always‑fresh index of developer excellence. Explore categories, search, and discover the best resources.",
  alternates: { canonical: "/" },
};

export default async function Home() {
  const catalog = await getCatalog();

  // Hero tagline variants — one is randomly selected per request
  const taglines = [
    "A curated, always‑fresh index of developer excellence",
    "Discover the best tools, libraries, and resources — curated daily",
    "Your gateway to top developer resources and insights",
    "Explore high‑quality frameworks, libraries, and guides in one place",
    "A living, ever‑growing index of the very best in software development",
  ];
  const randomIndex = Math.floor(Math.random() * taglines.length);
  const heroTagline = taglines[randomIndex];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const webpageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "VSCodeHub — Awesome Catalog",
    url: siteUrl,
    description:
      "Curated, always‑fresh index of developer excellence. Explore categories, search, and discover the best resources.",
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
