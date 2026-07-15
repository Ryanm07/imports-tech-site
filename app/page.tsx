import { HomePage } from "./home-page";
import type { Metadata } from "next";
import { getPublicEditorialData } from "@/lib/content-repository";
import { getTelegramLinks } from "@/lib/telegram";
import { getYouTubeMetrics } from "@/lib/youtube-service";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const [data, youtube] = await Promise.all([
    getPublicEditorialData(),
    getYouTubeMetrics(),
  ]);
  return (
    <HomePage
      reviews={data.reviews}
      finds={data.finds}
      categories={data.categories}
      featuredProjectSlugs={data.featuredProjectSlugs}
      telegram={getTelegramLinks(data.settings)}
      youtube={youtube}
    />
  );
}
