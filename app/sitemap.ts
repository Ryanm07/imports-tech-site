import type { MetadataRoute } from "next";
import {
  getPublishedFinds,
  getPublishedReviews,
} from "@/lib/content-repository";
import { getSiteUrl } from "@/lib/site-url";
import { getYouTubeData } from "@/lib/youtube-service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [reviews, finds, youtube] = await Promise.all([
    getPublishedReviews(),
    getPublishedFinds(),
    getYouTubeData(),
  ]);
  return buildSitemap({
    base: getSiteUrl(),
    reviews,
    finds,
    youtube,
    communityEnabled: process.env.COMMUNITY_ENABLED === "true",
  });
}

export function buildSitemap({
  base,
  reviews,
  finds,
  youtube,
  communityEnabled,
}: {
  base: URL;
  reviews: Awaited<ReturnType<typeof getPublishedReviews>>;
  finds: Awaited<ReturnType<typeof getPublishedFinds>>;
  youtube: Awaited<ReturnType<typeof getYouTubeData>>;
  communityEnabled: boolean;
}): MetadataRoute.Sitemap {
  const fixedRoutes = [
    ["", "2026-07-14"],
    ["/videos", youtube.lastSuccessfulSyncAt || youtube.syncedAt],
    ["/reviews", latest(reviews.map((item) => item.updatedAt))],
    ["/garimpos", latest(finds.map((item) => item.updatedAt))],
    ["/metricas", youtube.lastSuccessfulSyncAt || youtube.syncedAt],
    ["/sobre", "2026-07-14"],
    ["/privacidade", "2026-07-14"],
    ["/termos", "2026-07-14"],
    ["/afiliados", "2026-07-14"],
    ["/contato", "2026-07-14"],
  ];
  if (communityEnabled) {
    fixedRoutes.push(["/comunidade", "2026-07-14"]);
  }
  return [
    ...fixedRoutes.map(([route, modified]) => ({
      url: new URL(route || "/", base).toString(),
      lastModified: new Date(modified),
    })),
    ...reviews.map((review) => ({
      url: new URL(`/reviews/${review.slug}`, base).toString(),
      lastModified: new Date(review.updatedAt),
    })),
    ...finds.map((find) => ({
      url: new URL(`/garimpos/${find.slug}`, base).toString(),
      lastModified: new Date(find.updatedAt),
    })),
    ...youtube.videos.map((video) => ({
      url: new URL(`/videos/${video.id}`, base).toString(),
      lastModified: new Date(video.publishedAt),
    })),
  ];
}

function latest(values: string[]) {
  return [...values].sort().at(-1) || "2026-07-14";
}
