import { HomePage } from "./home-page";
import type { Metadata } from "next";
import { getPublicEditorialData } from "@/lib/content-repository";
import { getTelegramLinks } from "@/lib/telegram";
import { getPublicLinks } from "@/lib/public-links";
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
      featuredProjectSlugs={data.featuredProjectSlugs}
      telegram={getTelegramLinks(data.settings)}
      publicLinks={getPublicLinks(data.settings)}
      youtube={youtube}
      timeline={data.timeline}
      homeIntroduction={data.settings.home_introduction}
      commercialIntroduction={data.settings.commercial_introduction}
    />
  );
}
