import { BRAND_LINKS } from "@/lib/brand";
import type { Find, Review } from "@/lib/site-data";

export type PublicProject = {
  slug: string;
  title: string;
  kind: "Review" | "Garimpo";
  category: string;
  image: string;
  pricePaid: number | null;
  problem: string;
  repair: string | null;
  result: string;
  currentStatus: string;
  summary: string;
  youtubeUrl: string;
  tags: string[];
  updatedAt: string;
};

export function buildProjects(
  reviews: Review[],
  finds: Find[],
  featuredSlugs: string[] = [],
) {
  const projects: PublicProject[] = [
    ...reviews.map(reviewProject),
    ...finds.map(findProject),
  ];
  const priority = new Map(featuredSlugs.map((slug, index) => [slug, index]));
  return projects.sort((a, b) => {
    const aPriority = priority.get(a.slug);
    const bPriority = priority.get(b.slug);
    if (aPriority !== undefined || bPriority !== undefined) {
      return (
        (aPriority ?? Number.MAX_SAFE_INTEGER) -
        (bPriority ?? Number.MAX_SAFE_INTEGER)
      );
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

function reviewProject(review: Review): PublicProject {
  return {
    slug: review.slug,
    title: review.name,
    kind: "Review",
    category: review.category,
    image: review.imageUrl || youtubeThumbnail(review.videoId),
    pricePaid: review.pricePaid,
    problem: review.negatives[0] || "Nenhum problema confirmado no registro.",
    repair:
      review.repairCost === null
        ? null
        : `Reparo registrado: ${currency(review.repairCost)}.`,
    result: review.verdict || review.status,
    currentStatus: review.status,
    summary: review.summary,
    youtubeUrl: youtubeVideo(review.videoId),
    tags: [review.category, "Reviews"],
    updatedAt: review.updatedAt,
  };
}

function findProject(find: Find): PublicProject {
  return {
    slug: find.slug,
    title: find.product,
    kind: "Garimpo",
    category: find.tags[0] || "Garimpos",
    image: find.imageUrl || youtubeThumbnail(find.videoId),
    pricePaid: find.negotiatedPrice,
    problem: find.announcedProblem,
    repair:
      find.repairCost === null
        ? null
        : `Reparo registrado: ${currency(find.repairCost)}.`,
    result: find.result,
    currentStatus: find.currentStatus,
    summary: find.timeline[0]?.detail || find.result,
    youtubeUrl: youtubeVideo(find.videoId),
    tags: [...new Set(["Garimpos", ...find.tags])],
    updatedAt: find.updatedAt,
  };
}

function youtubeThumbnail(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

function youtubeVideo(id: string) {
  return `${BRAND_LINKS.youtubeWatch}${encodeURIComponent(id)}`;
}

function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
