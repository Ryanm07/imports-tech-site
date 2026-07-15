import type { MetadataRoute } from "next";
import {
  getPublishedFinds,
  getPublishedReviews,
} from "@/lib/content-repository";
import { getSiteUrl } from "@/lib/site-url";
import { getYouTubeMetrics } from "@/lib/youtube-service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [reviews, finds, youtube] = await Promise.all([
    getPublishedReviews(),
    getPublishedFinds(),
    getYouTubeMetrics(),
  ]);
  return buildSitemap({
    base: getSiteUrl(),
    reviews,
    finds,
    youtube,
  });
}

export function buildSitemap({
  base,
  reviews,
  finds,
  youtube,
}: {
  base: URL;
  reviews: Awaited<ReturnType<typeof getPublishedReviews>>;
  finds: Awaited<ReturnType<typeof getPublishedFinds>>;
  youtube: Awaited<ReturnType<typeof getYouTubeMetrics>>;
}): MetadataRoute.Sitemap {
  const fixedRoutes = [
    ["", "2026-07-14"],
    [
      "/projetos",
      latest([
        ...reviews.map((item) => item.updatedAt),
        ...finds.map((item) => item.updatedAt),
      ]),
    ],
    ["/metricas", youtube.updatedAt || "2026-07-14"],
    ["/sobre", "2026-07-14"],
    ["/comunidade", "2026-07-14"],
    ["/privacidade", "2026-07-14"],
    ["/termos", "2026-07-14"],
    ["/afiliados", "2026-07-14"],
    ["/contato", "2026-07-14"],
  ];
  return [
    ...fixedRoutes.map(([route, modified]) => ({
      url: new URL(route || "/", base).toString(),
      lastModified: new Date(modified),
    })),
  ];
}

function latest(values: string[]) {
  return [...values].sort().at(-1) || "2026-07-14";
}
