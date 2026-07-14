export type SearchableVideo = {
  id: string;
  title: string;
  category: string;
  tags?: string[];
  views: number;
  publishedAt: string;
  description?: string;
  keywords?: string[];
};

export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function searchVideos<T extends SearchableVideo>(
  videos: T[],
  query: string,
  category = "Todos",
): T[] {
  const term = normalizeSearch(query);
  return videos.filter((video) => {
    const videoCategories = [video.category, ...(video.tags || [])].map(
      normalizeSearch,
    );
    const categoryMatches =
      category === "Todos" ||
      videoCategories.includes(normalizeSearch(category));
    if (!categoryMatches) return false;
    if (!term) return true;
    const haystack = normalizeSearch(
      [
        video.title,
        video.description,
        video.category,
        ...(video.tags || []),
        ...(video.keywords || []),
      ]
        .filter(Boolean)
        .join(" "),
    );
    return haystack.includes(term);
  });
}

export function sortVideos<T extends SearchableVideo>(
  videos: T[],
  order: "recentes" | "antigos" | "vistos",
): T[] {
  return [...videos].sort((a, b) => {
    if (order === "vistos") return b.views - a.views;
    const delta =
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    return order === "antigos" ? -delta : delta;
  });
}
