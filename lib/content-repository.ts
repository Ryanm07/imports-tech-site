import { desc, eq } from "drizzle-orm";
import { contentEntries } from "@/db/schema";
import {
  sanitizeSlug,
  type ContentType,
  validateContentPayload,
} from "@/lib/content-schemas";
import {
  categories as versionedCategories,
  finds as versionedFinds,
  reviews as versionedReviews,
  type Category,
  type Find,
  type Review,
} from "@/lib/site-data";
import { storyMilestones, type StoryMilestone } from "@/lib/story";
import { projectsEnabled } from "@/lib/features";

type StoredEntry = typeof contentEntries.$inferSelect;
export type TimelineItem = StoryMilestone;

async function getStoredEntries(type: ContentType) {
  if (process.env.EDITORIAL_DB_ENABLED !== "true") return [];
  try {
    const { getDb } = await import("@/db");
    return await getDb()
      .select()
      .from(contentEntries)
      .where(eq(contentEntries.type, type))
      .orderBy(desc(contentEntries.updatedAt));
  } catch {
    // A database outage must not make the versioned public site disappear.
    return [];
  }
}

function parseEntry(entry: StoredEntry) {
  try {
    const parsed: unknown = JSON.parse(entry.payload);
    const validated = validateContentPayload(entry.type as ContentType, parsed);
    return validated.ok ? validated.payload : null;
  } catch {
    return null;
  }
}

export async function getPublishedReviews(): Promise<Review[]> {
  return publishedReviewsFromEntries(await getStoredEntries("review"));
}

export function publishedReviewsFromEntries(entries: StoredEntry[]): Review[] {
  return mergeWithTombstones(versionedReviews, entries, (entry) => {
    const payload = parseEntry(entry);
    return payload && entry.type === "review"
      ? {
          slug: entry.slug,
          name: entry.title,
          ...(payload as Omit<Review, "slug" | "name">),
        }
      : null;
  });
}

export async function getPublishedFinds(): Promise<Find[]> {
  return publishedFindsFromEntries(await getStoredEntries("find"));
}

export function publishedFindsFromEntries(entries: StoredEntry[]): Find[] {
  return mergeWithTombstones(versionedFinds, entries, (entry) => {
    const payload = parseEntry(entry);
    return payload && entry.type === "find"
      ? { slug: entry.slug, ...(payload as Omit<Find, "slug">) }
      : null;
  });
}

export async function getPublishedCategories(): Promise<Category[]> {
  const entries = await getStoredEntries("category");
  const base = versionedCategories.map((item) => ({
    ...item,
    slug: sanitizeSlug(item.name),
  }));
  return mergeWithTombstones(base, entries, (entry) => {
    const payload = parseEntry(entry);
    return payload && entry.type === "category"
      ? { ...(payload as Category), slug: entry.slug }
      : null;
  }).map(({ name, icon, description, relation }) => ({
    name,
    icon,
    description,
    ...(relation ? { relation } : {}),
  }));
}

export async function getFeaturedProjectSlugs() {
  const [reviews, finds] = await Promise.all([
    getStoredEntries("review"),
    getStoredEntries("find"),
  ]);
  return [...reviews, ...finds]
    .filter((entry) => entry.status === "published" && entry.featured)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((entry) => entry.slug);
}

export async function getSiteSettings() {
  const entries = await getStoredEntries("setting");
  return Object.fromEntries(
    entries.flatMap((entry) => {
      if (entry.status !== "published") return [];
      const payload = parseEntry(entry);
      if (!payload || entry.type !== "setting") return [];
      const setting = payload as { key: string; value: string };
      return [[setting.key, setting.value]];
    }),
  );
}

export async function getTimeline(): Promise<TimelineItem[]> {
  return publishedTimelineFromEntries(await getStoredEntries("timeline"));
}

export function publishedTimelineFromEntries(
  entries: StoredEntry[],
): TimelineItem[] {
  return mergeWithTombstones(storyMilestones, entries, (entry) => {
    const payload = parseEntry(entry);
    if (!payload || entry.type !== "timeline") return null;
    const fallback = storyMilestones.find((item) => item.slug === entry.slug);
    const timelinePayload = payload as Omit<TimelineItem, "slug">;
    const isLegacyCombinedGoal =
      entry.slug === "meta-2027" &&
      timelinePayload.position === 12 &&
      timelinePayload.description.includes(
        "Hoje, minha maior dificuldade é equilibrar o canal",
      );
    return {
      ...fallback,
      slug: entry.slug,
      ...timelinePayload,
      ...(isLegacyCombinedGoal && fallback
        ? { description: fallback.description, position: fallback.position }
        : {}),
    } as TimelineItem;
  }).sort((a, b) => a.position - b.position);
}

export async function getPublicEditorialData() {
  if (!projectsEnabled()) {
    const [settings, timeline] = await Promise.all([
      getSiteSettings(),
      getTimeline(),
    ]);
    return {
      reviews: [],
      finds: [],
      categories: [],
      featuredProjectSlugs: [],
      settings,
      timeline,
    };
  }
  const [reviews, finds, categories, featuredProjectSlugs, settings, timeline] =
    await Promise.all([
      getPublishedReviews(),
      getPublishedFinds(),
      getPublishedCategories(),
      getFeaturedProjectSlugs(),
      getSiteSettings(),
      getTimeline(),
    ]);
  return {
    reviews,
    finds,
    categories,
    featuredProjectSlugs,
    settings,
    timeline,
  };
}

function mergeWithTombstones<T extends { slug: string }>(
  base: T[],
  entries: StoredEntry[],
  materialize: (entry: StoredEntry) => T | null,
) {
  const merged = new Map(base.map((item) => [item.slug, item]));
  // The database has a unique type+slug key, but keeping this order makes the
  // behavior deterministic if legacy data ever contains duplicates.
  for (const entry of [...entries].reverse()) {
    if (entry.status === "archived" || entry.status === "removed") {
      merged.delete(entry.slug);
      continue;
    }
    if (entry.status !== "published") continue;
    const item = materialize(entry);
    if (item) merged.set(entry.slug, item);
  }
  return [...merged.values()];
}
