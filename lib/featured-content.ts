import type { Find, Review } from "./site-data";

export type FeaturedContent = {
  slug: string;
  title: string;
  summary: string;
  kind: "Garimpo" | "Review";
  category: string;
  videoId: string;
  thumbnail: string;
  url: string;
};

export function buildFeaturedContent(
  reviews: Review[],
  finds: Find[],
): FeaturedContent[] {
  const candidates: FeaturedContent[] = [
    ...finds.map((item) => ({
      slug: item.slug,
      title: item.product,
      summary: item.announcedProblem,
      kind: "Garimpo" as const,
      category: item.tags[0] || "Garimpos",
      videoId: item.videoId,
      thumbnail: `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${item.videoId}`,
    })),
    ...reviews.map((item) => ({
      slug: item.slug,
      title: item.name,
      summary: item.summary,
      kind: "Review" as const,
      category: item.category,
      videoId: item.videoId,
      thumbnail: `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${item.videoId}`,
    })),
  ];
  const preferredSlugs = [
    "iphone-12-por-658-36",
    "macbook-air-m1-usado",
    "galaxy-s21-ultra-em-2026",
  ];
  const priority = (item: FeaturedContent) => {
    const index = preferredSlugs.indexOf(item.slug);
    return index < 0 ? preferredSlugs.length : index;
  };

  const seen = new Set<string>();
  return candidates
    .sort((a, b) => priority(a) - priority(b))
    .filter((item) => {
      if (
        item.videoId.length !== 11 ||
        !/^[A-Za-z0-9_-]{11}$/u.test(item.videoId) ||
        seen.has(item.videoId)
      ) {
        return false;
      }
      seen.add(item.videoId);
      return true;
    })
    .slice(0, 3);
}
