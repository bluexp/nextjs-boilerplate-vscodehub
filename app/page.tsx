import MainPage from "@/components/MainPage";
import { getCatalog } from "@/lib/kv";

/**
 * Home page server component.
 * Prefetch catalog on the server to reduce first-load flicker and pass as initialCatalog to the client component.
 */
export default async function Home() {
  const catalog = await getCatalog();
  return <MainPage initialCatalog={catalog ?? undefined} />;
}
