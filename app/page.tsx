import { HomePage } from "./home-page";
import type { Metadata } from "next";
import { getPublicEditorialData } from "@/lib/content-repository";
import { getTelegramLinks } from "@/lib/telegram";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const data = await getPublicEditorialData();
  return (
    <HomePage
      reviews={data.reviews}
      finds={data.finds}
      categories={data.categories}
      featuredVideoId={
        (data.featuredVideos[0] as { id?: string } | undefined)?.id
      }
      telegram={getTelegramLinks(data.settings)}
    />
  );
}
