import { and, desc, eq } from "drizzle-orm";
import { contentEntries } from "@/db/schema";
import {
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

type StoredEntry = typeof contentEntries.$inferSelect;

async function getPublishedEntries(type: ContentType) {
  if (process.env.ADMIN_ENABLED !== "true") return [];
  try {
    const { getDb } = await import("@/db");
    return await getDb()
      .select()
      .from(contentEntries)
      .where(
        and(
          eq(contentEntries.type, type),
          eq(contentEntries.status, "published"),
        ),
      )
      .orderBy(desc(contentEntries.updatedAt));
  } catch {
    return [];
  }
}

function parseEntry(entry: StoredEntry) {
  try {
    const parsed: unknown = JSON.parse(entry.payload);
    const validated = validateContentPayload(entry.type, parsed);
    return validated.ok ? validated.payload : null;
  } catch {
    return null;
  }
}

export async function getPublishedReviews(): Promise<Review[]> {
  const entries = await getPublishedEntries("review");
  return publishedReviewsFromEntries(entries);
}

export function publishedReviewsFromEntries(entries: StoredEntry[]): Review[] {
  const overrides = entries.flatMap((entry) => {
    const payload = parseEntry(entry);
    return payload && entry.type === "review"
      ? [
          {
            slug: entry.slug,
            name: entry.title,
            ...(payload as Omit<Review, "slug" | "name">),
          },
        ]
      : [];
  });
  return mergeBySlug(versionedReviews, overrides);
}

export async function getPublishedFinds(): Promise<Find[]> {
  const entries = await getPublishedEntries("find");
  return publishedFindsFromEntries(entries);
}

export function publishedFindsFromEntries(entries: StoredEntry[]): Find[] {
  const overrides = entries.flatMap((entry) => {
    const payload = parseEntry(entry);
    return payload && entry.type === "find"
      ? [{ slug: entry.slug, ...(payload as Omit<Find, "slug">) }]
      : [];
  });
  return mergeBySlug(versionedFinds, overrides);
}

export async function getPublishedCategories(): Promise<Category[]> {
  const entries = await getPublishedEntries("category");
  const overrides = entries.flatMap((entry) => {
    const payload = parseEntry(entry);
    return payload && entry.type === "category" ? [payload as Category] : [];
  });
  const merged = new Map(versionedCategories.map((item) => [item.name, item]));
  for (const item of overrides) merged.set(item.name, item);
  return [...merged.values()];
}

export async function getFeaturedVideos() {
  const entries = await getPublishedEntries("video");
  return entries.flatMap((entry) => {
    if (!entry.featured) return [];
    const payload = parseEntry(entry);
    return payload && entry.type === "video" ? [payload] : [];
  });
}

export async function getSiteSettings() {
  const entries = await getPublishedEntries("setting");
  return Object.fromEntries(
    entries.flatMap((entry) => {
      const payload = parseEntry(entry);
      if (!payload || entry.type !== "setting") return [];
      const setting = payload as { key: string; value: string };
      return [[setting.key, setting.value]];
    }),
  );
}

export async function getPublicEditorialData() {
  const [reviews, finds, categories, featuredVideos, settings] =
    await Promise.all([
      getPublishedReviews(),
      getPublishedFinds(),
      getPublishedCategories(),
      getFeaturedVideos(),
      getSiteSettings(),
    ]);
  return { reviews, finds, categories, featuredVideos, settings };
}

function mergeBySlug<T extends { slug: string }>(base: T[], overrides: T[]) {
  const merged = new Map(base.map((item) => [item.slug, item]));
  for (const item of overrides) merged.set(item.slug, item);
  return [...merged.values()];
}
