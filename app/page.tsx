import MainPage from "@/components/MainPage";
import { getCatalog } from "@/lib/kv";

/**
 * Home page server component.
 * Prefetch catalog on the server to reduce first-load flicker and pass as initialCatalog to the client component.
 * Also selects a random hero tagline on each request to display one of several variants per refresh.
 */
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

  return <MainPage initialCatalog={catalog ?? undefined} heroTagline={heroTagline} />;
}
