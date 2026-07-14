import { asc, eq } from "drizzle-orm";
import {
  contentEntries,
  youtubeChannelState,
  youtubeSnapshots,
  youtubeSyncRuns,
  youtubeVideos,
} from "@/db/schema";
import { BRAND_LINKS } from "@/lib/brand";
import {
  classifyVideo,
  VIDEO_CATEGORIES,
  type VideoCategory,
} from "@/lib/video-taxonomy";

export const YOUTUBE_CHANNEL_ID =
  process.env.YOUTUBE_CHANNEL_ID || "UCzCdaGidi49uW9eJEXs9M4A";
export const YOUTUBE_CHANNEL_URL = BRAND_LINKS.youtube;

export type YouTubeVideo = {
  id: string;
  title: string;
  views: number;
  likes?: number | null;
  comments?: number | null;
  publishedAt: string;
  duration: string;
  thumbnail: string;
  category: VideoCategory;
  tags: VideoCategory[];
  description: string;
  keywords: string[];
  availability?: "public" | "unavailable";
  featured?: boolean;
  summary?: string | null;
  relatedReviewSlug?: string | null;
  relatedFindSlug?: string | null;
};

export type YouTubeData = {
  channelName: string;
  handle: string;
  description: string;
  subscribers: number;
  totalViews: number;
  videoCount: number;
  monthlyGrowth: number;
  channelUrl: string;
  videoCatalogSource:
    | "youtube-api"
    | "youtube-feed"
    | "snapshot"
    | "unavailable";
  videoCatalogUpdatedAt: string | null;
  videoCatalogPartial: boolean;
  videoCatalogStale: boolean;
  channelMetricsSource: "youtube-api" | "snapshot" | "unavailable";
  channelMetricsUpdatedAt: string | null;
  channelMetricsStale: boolean;
  indexedVideoCount: number;
  syncStatus: "idle" | "running" | "failed";
  lastAttemptAt: string | null;
  lastSuccessfulSyncAt: string | null;
  lastFullSyncAt: string | null;
  lastError: string | null;
  videos: YouTubeVideo[];
  // Compatibility fields retained while the existing visual components move
  // to the independent catalog and metrics freshness fields above.
  source: "youtube-api" | "youtube-feed" | "snapshot" | "unavailable";
  isStale: boolean;
  isPartial: boolean;
  syncedAt: string;
};

type Fetcher = typeof fetch;
type SyncMode = "incremental" | "full";
type SyncTrigger = "cron" | "manual";
type YouTubeApiItem = {
  id?: string;
  contentDetails?: {
    relatedPlaylists?: { uploads?: string };
    videoId?: string;
    duration?: string;
  };
  snippet?: {
    title?: string;
    customUrl?: string;
    description?: string;
    publishedAt?: string;
    tags?: string[];
    thumbnails?: { maxres?: { url?: string }; high?: { url?: string } };
  };
  statistics?: {
    subscriberCount?: string;
    viewCount?: string;
    videoCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
};
type YouTubeApiResponse = {
  items?: YouTubeApiItem[];
  nextPageToken?: string;
};

const snapshotVideos = [
  [
    "fnD2R4YoJ8k",
    "Velho, mas não obsoleto! Será que o iPhone 12 Ainda Vale a Pena em 2026?",
    1100,
    "2026-07-10",
    "14:08",
  ],
  [
    "i4LXDsWlc8Q",
    "Comprei um iPhone 12 por R$650… Me Dei Bem?",
    5400,
    "2026-07-02",
    "5:04",
  ],
  [
    "biatbb6rvwU",
    "Usei o Galaxy S21 Ultra em 2026… Ele Ainda é ABSURDO?",
    5100,
    "2026-06-30",
    "11:03",
  ],
  [
    "cbodYFxeINo",
    "Paguei R$2.500 no MacBook Mais Vendido do Brasil... Valeu a Pena?",
    11000,
    "2026-06-23",
    "13:32",
  ],
  [
    "ScBB5TZ-Py8",
    "Achei um S21 Ultra por R$502,89 na OLX… Eu tive que Arriscar",
    76000,
    "2026-06-16",
    "14:21",
  ],
  [
    "Y1nStLptXY0",
    "Paguei R$1.200 no notebook gamer mais vendido do Brasil... valeu a pena?",
    243000,
    "2026-06-10",
    "19:07",
  ],
] as const;

const versionedVideos = snapshotVideos.map(
  ([id, title, views, publishedAt, duration]) => {
    const taxonomy = classifyVideo(title, id);
    return {
      id,
      title,
      views,
      publishedAt,
      duration,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      ...taxonomy,
      description: title,
      keywords: taxonomy.tags,
      availability: "public" as const,
    };
  },
);

const SNAPSHOT_AT = "2026-07-10T00:00:00.000Z";
const versionedSnapshot: YouTubeData = {
  channelName: "Imports Tech!",
  handle: "@Imports_Tech",
  description:
    "Tecnologia de verdade, sem enrolação: reviews, testes no uso real, usados, garimpos e custo-benefício.",
  subscribers: 3340,
  totalViews: 610472,
  videoCount: 80,
  monthlyGrowth: 0,
  channelUrl: YOUTUBE_CHANNEL_URL,
  videoCatalogSource: "snapshot",
  videoCatalogUpdatedAt: SNAPSHOT_AT,
  videoCatalogPartial: true,
  videoCatalogStale: true,
  channelMetricsSource: "snapshot",
  channelMetricsUpdatedAt: SNAPSHOT_AT,
  channelMetricsStale: true,
  indexedVideoCount: versionedVideos.length,
  syncStatus: "idle",
  lastAttemptAt: SNAPSHOT_AT,
  lastSuccessfulSyncAt: SNAPSHOT_AT,
  lastFullSyncAt: null,
  lastError: null,
  source: "snapshot",
  isStale: true,
  isPartial: true,
  syncedAt: SNAPSHOT_AT,
  videos: versionedVideos,
};

export async function getYouTubeData(): Promise<YouTubeData> {
  try {
    const { getDb } = await import("@/db");
    const db = getDb();
    const [states, rows, editorialRows] = await Promise.all([
      db
        .select()
        .from(youtubeChannelState)
        .where(eq(youtubeChannelState.channelId, YOUTUBE_CHANNEL_ID))
        .limit(1),
      db
        .select()
        .from(youtubeVideos)
        .where(eq(youtubeVideos.availability, "public"))
        .orderBy(asc(youtubeVideos.position)),
      process.env.EDITORIAL_DB_ENABLED === "true"
        ? db
            .select()
            .from(contentEntries)
            .where(eq(contentEntries.type, "video"))
        : Promise.resolve([]),
    ]);
    const state = states[0];
    if (!state) return versionedSnapshot;
    const now = Date.now();
    const catalogStale =
      state.catalogStale ||
      isOlderThan(state.catalogUpdatedAt, now, 3 * 60 * 60_000);
    const metricsStale =
      state.metricsStale ||
      isOlderThan(state.metricsUpdatedAt, now, 3 * 60 * 60_000);
    const editorial = new Map(
      editorialRows.flatMap((entry) => {
        if (entry.status !== "published") return [];
        try {
          const payload = JSON.parse(entry.payload) as {
            id?: string;
            category?: string;
            tags?: string[];
            summary?: string;
            relatedReviewSlug?: string | null;
            relatedFindSlug?: string | null;
          };
          return payload.id
            ? [[payload.id, { ...payload, featured: entry.featured }] as const]
            : [];
        } catch {
          return [];
        }
      }),
    );
    const videos = rows.map((row) => {
      const taxonomy = classifyVideo(row.title, row.id);
      const storedTags = parseStringArray(row.tags);
      const override = editorial.get(row.id);
      const overrideTags = (override?.tags ?? []).filter((tag) =>
        VIDEO_CATEGORIES.includes(tag as VideoCategory),
      ) as VideoCategory[];
      return {
        id: row.id,
        title: row.title,
        views: row.views,
        likes: row.likes,
        comments: row.comments,
        publishedAt: row.publishedAt,
        duration: row.duration,
        thumbnail:
          row.thumbnail || `https://i.ytimg.com/vi/${row.id}/hqdefault.jpg`,
        category:
          (override?.category as VideoCategory | undefined) ||
          (row.category as VideoCategory | null) ||
          taxonomy.category,
        tags: overrideTags.length
          ? overrideTags
          : ((storedTags.length
              ? storedTags
              : taxonomy.tags) as VideoCategory[]),
        description: row.description,
        keywords: storedTags.length ? storedTags : taxonomy.tags,
        availability: row.availability,
        featured: override?.featured ?? row.featured,
        summary: override?.summary || row.summary,
        relatedReviewSlug: override?.relatedReviewSlug ?? row.relatedReviewSlug,
        relatedFindSlug: override?.relatedFindSlug ?? row.relatedFindSlug,
      };
    });
    const syncedAt = state.lastAttemptAt || state.updatedAt;
    return {
      channelName: state.channelName || versionedSnapshot.channelName,
      handle: state.handle || versionedSnapshot.handle,
      description: state.description || versionedSnapshot.description,
      subscribers: state.subscribers ?? 0,
      totalViews: state.totalViews ?? 0,
      videoCount: state.videoCount ?? 0,
      monthlyGrowth: 0,
      channelUrl: YOUTUBE_CHANNEL_URL,
      videoCatalogSource: state.catalogSource,
      videoCatalogUpdatedAt: state.catalogUpdatedAt,
      videoCatalogPartial: state.catalogPartial,
      videoCatalogStale: catalogStale,
      channelMetricsSource: state.metricsSource,
      channelMetricsUpdatedAt: state.metricsUpdatedAt,
      channelMetricsStale: metricsStale,
      indexedVideoCount: state.indexedVideoCount,
      syncStatus: state.syncStatus,
      lastAttemptAt: state.lastAttemptAt,
      lastSuccessfulSyncAt: state.lastSuccessAt,
      lastFullSyncAt: state.lastFullSyncAt,
      lastError: state.lastError,
      videos,
      source: state.catalogSource,
      isStale: catalogStale,
      isPartial: state.catalogPartial,
      syncedAt,
    };
  } catch {
    return versionedSnapshot;
  }
}

export async function fetchYouTubeApi({
  apiKey,
  channelId,
  fetcher,
  now,
  mode = "full",
}: {
  apiKey: string;
  channelId: string;
  fetcher: Fetcher;
  now: Date;
  mode?: SyncMode;
}): Promise<YouTubeData> {
  const result = await fetchApiCatalog({ apiKey, channelId, fetcher, mode });
  const syncedAt = now.toISOString();
  const isPartial =
    mode === "incremental" ||
    result.uploadIds.length < result.channelVideoCount;
  return {
    channelName: result.channelName,
    handle: result.handle,
    description: result.description,
    subscribers: result.subscribers,
    totalViews: result.totalViews,
    videoCount: result.channelVideoCount,
    monthlyGrowth: 0,
    channelUrl: YOUTUBE_CHANNEL_URL,
    videoCatalogSource: "youtube-api",
    videoCatalogUpdatedAt: syncedAt,
    videoCatalogPartial: isPartial,
    videoCatalogStale: false,
    channelMetricsSource: "youtube-api",
    channelMetricsUpdatedAt: syncedAt,
    channelMetricsStale: false,
    indexedVideoCount: result.videos.filter(
      (video) => video.availability === "public",
    ).length,
    syncStatus: "idle",
    lastAttemptAt: syncedAt,
    lastSuccessfulSyncAt: syncedAt,
    lastFullSyncAt: mode === "full" ? syncedAt : null,
    lastError: null,
    source: "youtube-api",
    isStale: false,
    isPartial,
    syncedAt,
    videos: result.videos,
  };
}

export async function runYouTubeSync({
  trigger,
  mode,
  apiKey = process.env.YOUTUBE_API_KEY,
  channelId = YOUTUBE_CHANNEL_ID,
  fetcher = fetch,
  now = new Date(),
}: {
  trigger: SyncTrigger;
  mode: SyncMode;
  apiKey?: string;
  channelId?: string;
  fetcher?: Fetcher;
  now?: Date;
}) {
  const { getDb, getD1 } = await import("@/db");
  const db = getDb();
  const d1 = getD1();
  const startedAt = now.toISOString();
  const runId = crypto.randomUUID();
  const lockUntil = new Date(now.getTime() + 10 * 60_000).toISOString();

  await d1
    .prepare(
      `INSERT INTO youtube_channel_state
       (channel_id, metrics_source, metrics_stale, catalog_source, catalog_partial,
        catalog_stale, indexed_video_count, sync_status, updated_at)
       VALUES (?, 'unavailable', 1, 'unavailable', 1, 1, 0, 'idle', ?)
       ON CONFLICT(channel_id) DO NOTHING`,
    )
    .bind(channelId, startedAt)
    .run();
  const locked = await d1
    .prepare(
      `UPDATE youtube_channel_state
       SET lock_expires_at = ?, sync_status = 'running', last_attempt_at = ?, updated_at = ?
       WHERE channel_id = ? AND (lock_expires_at IS NULL OR lock_expires_at <= ?)
       RETURNING channel_id`,
    )
    .bind(lockUntil, startedAt, startedAt, channelId, startedAt)
    .first<{ channel_id: string }>();
  if (!locked) {
    await db.insert(youtubeSyncRuns).values({
      id: runId,
      trigger,
      mode,
      status: "skipped",
      startedAt,
      completedAt: startedAt,
      errorCode: "lock-active",
      errorMessage: "Outra sincronização está em andamento.",
    });
    return { status: "skipped" as const, reason: "lock-active" as const };
  }

  await db.insert(youtubeSyncRuns).values({
    id: runId,
    trigger,
    mode,
    status: "running",
    startedAt,
  });

  try {
    if (!apiKey)
      throw new YouTubeSyncError(
        "missing-api-key",
        "Chave da API do YouTube não configurada.",
      );
    const catalog = await fetchApiCatalog({ apiKey, channelId, fetcher, mode });
    await persistApiCatalog(catalog, mode, startedAt);
    const completedAt = new Date().toISOString();
    await db
      .update(youtubeSyncRuns)
      .set({
        status: "succeeded",
        completedAt,
        videosFound: catalog.uploadIds.length,
        videosIndexed: catalog.videos.filter(
          (video) => video.availability === "public",
        ).length,
      })
      .where(eq(youtubeSyncRuns.id, runId));
    await releaseLock(channelId, completedAt, null);
    return {
      status: "succeeded" as const,
      source: "youtube-api" as const,
      videosFound: catalog.uploadIds.length,
    };
  } catch (apiError) {
    const failure = safeSyncError(apiError);
    try {
      const feed = await fetchYouTubeFeed({ channelId, fetcher, now });
      await persistFeedCatalog(
        feed,
        mode,
        startedAt,
        failure.message,
        channelId,
      );
      const completedAt = new Date().toISOString();
      await db
        .update(youtubeSyncRuns)
        .set({
          status: "succeeded",
          completedAt,
          videosFound: feed.videos.length,
          videosIndexed: feed.videos.length,
          errorCode: failure.code,
          errorMessage: failure.message,
        })
        .where(eq(youtubeSyncRuns.id, runId));
      await releaseLock(channelId, completedAt, failure.message);
      return {
        status: "succeeded" as const,
        source: "youtube-feed" as const,
        videosFound: feed.videos.length,
      };
    } catch {
      const completedAt = new Date().toISOString();
      await db
        .update(youtubeSyncRuns)
        .set({
          status: "failed",
          completedAt,
          errorCode: failure.code,
          errorMessage: failure.message,
        })
        .where(eq(youtubeSyncRuns.id, runId));
      await d1
        .prepare(
          `UPDATE youtube_channel_state SET sync_status = 'failed', metrics_stale = 1,
           catalog_stale = 1, last_error = ?, lock_expires_at = NULL, updated_at = ?
           WHERE channel_id = ?`,
        )
        .bind(failure.message, completedAt, channelId)
        .run();
      return { status: "failed" as const, errorCode: failure.code };
    }
  }
}

async function fetchApiCatalog({
  apiKey,
  channelId,
  fetcher,
  mode,
}: {
  apiKey: string;
  channelId: string;
  fetcher: Fetcher;
  mode: SyncMode;
}) {
  const channel = await fetchJson(
    fetcher,
    "https://www.googleapis.com/youtube/v3/channels",
    {
      part: "snippet,statistics,contentDetails",
      id: channelId,
    },
    apiKey,
  );
  const item = channel.items?.[0];
  const playlistId = item?.contentDetails?.relatedPlaylists?.uploads;
  if (!item || !playlistId) {
    throw new YouTubeSyncError(
      "channel-unavailable",
      "Canal ou playlist de uploads indisponível.",
    );
  }

  const uploadIds: string[] = [];
  const seen = new Set<string>();
  let pageToken: string | undefined;
  do {
    const page = await fetchJson(
      fetcher,
      "https://www.googleapis.com/youtube/v3/playlistItems",
      {
        part: "contentDetails",
        playlistId,
        maxResults: "50",
        ...(pageToken ? { pageToken } : {}),
      },
      apiKey,
    );
    for (const upload of page.items ?? []) {
      const id = upload.contentDetails?.videoId;
      if (id && !seen.has(id)) {
        seen.add(id);
        uploadIds.push(id);
      }
    }
    pageToken = mode === "full" ? page.nextPageToken || undefined : undefined;
  } while (pageToken);

  const details = new Map<string, YouTubeVideo>();
  for (let index = 0; index < uploadIds.length; index += 50) {
    const ids = uploadIds.slice(index, index + 50);
    const page = await fetchJson(
      fetcher,
      "https://www.googleapis.com/youtube/v3/videos",
      {
        part: "statistics,contentDetails,snippet",
        id: ids.join(","),
      },
      apiKey,
    );
    for (const video of page.items ?? []) {
      if (!video.id) continue;
      const taxonomy = classifyVideo(video.snippet?.title || "", video.id);
      details.set(video.id, {
        id: video.id,
        title: video.snippet?.title || "Vídeo sem título",
        views: safeNumber(video.statistics?.viewCount),
        likes: optionalNumber(video.statistics?.likeCount),
        comments: optionalNumber(video.statistics?.commentCount),
        publishedAt: video.snippet?.publishedAt || "",
        duration: isoDuration(video.contentDetails?.duration),
        thumbnail:
          video.snippet?.thumbnails?.maxres?.url ||
          video.snippet?.thumbnails?.high?.url ||
          `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
        ...taxonomy,
        description: video.snippet?.description || "",
        keywords: Array.isArray(video.snippet?.tags)
          ? video.snippet.tags.slice(0, 30)
          : taxonomy.tags,
        availability: "public",
      });
    }
  }
  const videos = uploadIds.map(
    (id) =>
      details.get(id) ?? {
        id,
        title: "Vídeo indisponível",
        views: 0,
        likes: null,
        comments: null,
        publishedAt: "",
        duration: "",
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        ...classifyVideo("", id),
        description: "",
        keywords: [],
        availability: "unavailable" as const,
      },
  );
  return {
    channelId,
    channelName: item.snippet?.title || "Imports Tech!",
    handle: item.snippet?.customUrl || "@Imports_Tech",
    description:
      item.snippet?.description?.split("\n")[0] ||
      versionedSnapshot.description,
    subscribers: safeNumber(item.statistics?.subscriberCount),
    totalViews: safeNumber(item.statistics?.viewCount),
    channelVideoCount:
      safeNumber(item.statistics?.videoCount) || uploadIds.length,
    playlistId,
    uploadIds,
    videos,
  };
}

export async function fetchYouTubeFeed({
  channelId,
  fetcher,
  now,
}: {
  channelId: string;
  fetcher: Fetcher;
  now: Date;
}): Promise<YouTubeData> {
  const response = await fetchWithTimeout(
    fetcher,
    `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`,
  );
  if (!response.ok)
    throw new YouTubeSyncError(
      "feed-error",
      `Feed do YouTube respondeu ${response.status}.`,
    );
  const xml = await response.text();
  const videos = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
    .slice(0, 15)
    .flatMap((entry) => {
      const block = entry[1];
      const id = tag(block, "yt:videoId");
      const title = tag(block, "title");
      if (!id || !title) return [];
      const taxonomy = classifyVideo(title, id);
      return [
        {
          id,
          title,
          views: Number(
            block.match(/<media:statistics[^>]*views="(\d+)"/)?.[1] || 0,
          ),
          publishedAt: tag(block, "published"),
          duration: "",
          thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          ...taxonomy,
          description: tag(block, "media:description"),
          keywords: taxonomy.tags,
          availability: "public" as const,
        },
      ];
    });
  if (!videos.length)
    throw new YouTubeSyncError("empty-feed", "Feed sem vídeos válidos.");
  const syncedAt = now.toISOString();
  return {
    ...versionedSnapshot,
    videoCatalogSource: "youtube-feed",
    videoCatalogUpdatedAt: syncedAt,
    videoCatalogPartial: true,
    videoCatalogStale: false,
    indexedVideoCount: videos.length,
    source: "youtube-feed",
    isStale: false,
    isPartial: true,
    syncedAt,
    lastAttemptAt: syncedAt,
    lastSuccessfulSyncAt: syncedAt,
    videos,
  };
}

async function persistApiCatalog(
  catalog: Awaited<ReturnType<typeof fetchApiCatalog>>,
  mode: SyncMode,
  syncedAt: string,
) {
  const { getDb } = await import("@/db");
  const db = getDb();
  if (mode === "full") {
    await db
      .update(youtubeVideos)
      .set({ availability: "unavailable", syncedAt });
  }
  for (const [position, video] of catalog.videos.entries()) {
    const taxonomy = classifyVideo(video.title, video.id);
    await db
      .insert(youtubeVideos)
      .values({
        id: video.id,
        position,
        title: video.title,
        description: video.description,
        publishedAt: video.publishedAt,
        duration: video.duration,
        thumbnail: video.thumbnail,
        views: video.views,
        likes: video.likes ?? null,
        comments: video.comments ?? null,
        availability: video.availability || "public",
        category: taxonomy.category,
        tags: JSON.stringify(video.keywords),
        syncedAt,
      })
      .onConflictDoUpdate({
        target: youtubeVideos.id,
        set: {
          position,
          title: video.title,
          description: video.description,
          publishedAt: video.publishedAt,
          duration: video.duration,
          thumbnail: video.thumbnail,
          views: video.views,
          likes: video.likes ?? null,
          comments: video.comments ?? null,
          availability: video.availability || "public",
          syncedAt,
        },
      });
  }
  const publicCount = catalog.videos.filter(
    (video) => video.availability === "public",
  ).length;
  const previous = await db
    .select()
    .from(youtubeChannelState)
    .where(eq(youtubeChannelState.channelId, catalog.channelId))
    .limit(1);
  const partial =
    mode === "full"
      ? catalog.uploadIds.length < catalog.channelVideoCount
      : (previous[0]?.catalogPartial ?? true);
  await db
    .insert(youtubeChannelState)
    .values({
      channelId: catalog.channelId,
      channelName: catalog.channelName,
      handle: catalog.handle,
      description: catalog.description,
      uploadsPlaylistId: catalog.playlistId,
      subscribers: catalog.subscribers,
      totalViews: catalog.totalViews,
      videoCount: catalog.channelVideoCount,
      metricsSource: "youtube-api",
      metricsUpdatedAt: syncedAt,
      metricsStale: false,
      catalogSource: "youtube-api",
      catalogUpdatedAt: syncedAt,
      catalogPartial: partial,
      catalogStale: false,
      indexedVideoCount:
        mode === "full"
          ? publicCount
          : Math.max(previous[0]?.indexedVideoCount ?? 0, publicCount),
      syncStatus: "idle",
      lastAttemptAt: syncedAt,
      lastSuccessAt: syncedAt,
      lastFullSyncAt: mode === "full" ? syncedAt : previous[0]?.lastFullSyncAt,
      lastError: null,
      lockExpiresAt: null,
      updatedAt: syncedAt,
    })
    .onConflictDoUpdate({
      target: youtubeChannelState.channelId,
      set: {
        channelName: catalog.channelName,
        handle: catalog.handle,
        description: catalog.description,
        uploadsPlaylistId: catalog.playlistId,
        subscribers: catalog.subscribers,
        totalViews: catalog.totalViews,
        videoCount: catalog.channelVideoCount,
        metricsSource: "youtube-api",
        metricsUpdatedAt: syncedAt,
        metricsStale: false,
        catalogSource: "youtube-api",
        catalogUpdatedAt: syncedAt,
        catalogPartial: partial,
        catalogStale: false,
        indexedVideoCount:
          mode === "full"
            ? publicCount
            : Math.max(previous[0]?.indexedVideoCount ?? 0, publicCount),
        syncStatus: "idle",
        lastAttemptAt: syncedAt,
        lastSuccessAt: syncedAt,
        lastFullSyncAt:
          mode === "full" ? syncedAt : previous[0]?.lastFullSyncAt,
        lastError: null,
        lockExpiresAt: null,
        updatedAt: syncedAt,
      },
    });
}

async function persistFeedCatalog(
  feed: YouTubeData,
  mode: SyncMode,
  syncedAt: string,
  apiError: string,
  channelId: string,
) {
  const { getDb } = await import("@/db");
  const db = getDb();
  for (const [position, video] of feed.videos.entries()) {
    await db
      .insert(youtubeVideos)
      .values({
        id: video.id,
        position,
        title: video.title,
        description: video.description,
        publishedAt: video.publishedAt,
        duration: video.duration,
        thumbnail: video.thumbnail,
        views: video.views,
        availability: "public",
        category: video.category,
        tags: JSON.stringify(video.keywords),
        syncedAt,
      })
      .onConflictDoUpdate({
        target: youtubeVideos.id,
        set: {
          position,
          title: video.title,
          description: video.description,
          publishedAt: video.publishedAt,
          thumbnail: video.thumbnail,
          views: video.views,
          availability: "public",
          syncedAt,
        },
      });
  }
  const previous = await db
    .select()
    .from(youtubeChannelState)
    .where(eq(youtubeChannelState.channelId, channelId))
    .limit(1);
  await db
    .update(youtubeChannelState)
    .set({
      catalogSource: "youtube-feed",
      catalogUpdatedAt: syncedAt,
      catalogPartial: true,
      catalogStale: false,
      indexedVideoCount: Math.max(
        previous[0]?.indexedVideoCount ?? 0,
        feed.videos.length,
      ),
      metricsStale: true,
      syncStatus: "idle",
      lastAttemptAt: syncedAt,
      lastSuccessAt: syncedAt,
      lastFullSyncAt: previous[0]?.lastFullSyncAt,
      lastError: apiError,
      lockExpiresAt: null,
      updatedAt: syncedAt,
    })
    .where(eq(youtubeChannelState.channelId, channelId));
}

async function releaseLock(
  channelId: string,
  completedAt: string,
  error: string | null,
) {
  const { getD1 } = await import("@/db");
  await getD1()
    .prepare(
      `UPDATE youtube_channel_state SET sync_status = 'idle', lock_expires_at = NULL,
       last_error = ?, updated_at = ? WHERE channel_id = ?`,
    )
    .bind(error, completedAt, channelId)
    .run();
}

async function fetchJson(
  fetcher: Fetcher,
  base: string,
  params: Record<string, string>,
  apiKey: string,
): Promise<YouTubeApiResponse> {
  const url = new URL(base);
  url.search = new URLSearchParams(params).toString();
  const response = await fetchWithTimeout(fetcher, url, {
    "X-Goog-Api-Key": apiKey,
  });
  if (!response.ok) {
    throw new YouTubeSyncError(
      "youtube-api-error",
      `YouTube API respondeu ${response.status}.`,
    );
  }
  const data = await response.json();
  if (!data || typeof data !== "object") {
    throw new YouTubeSyncError(
      "invalid-api-response",
      "Resposta incompleta do YouTube.",
    );
  }
  return data as YouTubeApiResponse;
}

async function fetchWithTimeout(
  fetcher: Fetcher,
  input: string | URL,
  headers: Record<string, string> = {},
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    return await fetcher(input, {
      cache: "no-store",
      signal: controller.signal,
      headers: { "Accept-Language": "pt-BR,pt;q=0.9", ...headers },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function safeSyncError(value: unknown) {
  if (value instanceof YouTubeSyncError)
    return { code: value.code, message: value.message.slice(0, 240) };
  return { code: "sync-error", message: "Falha ao consultar o YouTube." };
}

class YouTubeSyncError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function isOlderThan(value: string | null, now: number, threshold: number) {
  if (!value) return true;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) || now - timestamp > threshold;
}

function safeNumber(value: string | undefined) {
  const number = Number(value ?? 0);
  return Number.isSafeInteger(number) && number >= 0 ? number : 0;
}

function optionalNumber(value: string | undefined) {
  if (value === undefined) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

function parseStringArray(value: string | null) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function decodeText(value = "") {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function tag(xml: string, name: string) {
  return decodeText(
    xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`))?.[1] || "",
  );
}

function isoDuration(value = "PT0M0S") {
  const hours = Number(value.match(/(\d+)H/)?.[1] || 0);
  const minutes = Number(value.match(/(\d+)M/)?.[1] || 0);
  const seconds = Number(value.match(/(\d+)S/)?.[1] || 0);
  return [
    hours,
    String(minutes).padStart(hours ? 2 : 1, "0"),
    String(seconds).padStart(2, "0"),
  ]
    .filter((part, index) => index > 0 || hours)
    .join(":");
}

export function getVersionedYouTubeSnapshot() {
  return versionedSnapshot;
}

// Retained only for migration compatibility. Visitor requests never call this
// function; fresh snapshots are persisted by runYouTubeSync.
export async function saveLegacyYouTubeSnapshot(data: YouTubeData) {
  const { getDb } = await import("@/db");
  const now = new Date().toISOString();
  await getDb()
    .insert(youtubeSnapshots)
    .values({
      channelId: YOUTUBE_CHANNEL_ID,
      payload: JSON.stringify(data),
      source:
        data.videoCatalogSource === "youtube-api"
          ? "youtube-api"
          : "youtube-feed",
      lastSuccessfulSyncAt: data.lastSuccessfulSyncAt || now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: youtubeSnapshots.channelId,
      set: { payload: JSON.stringify(data), updatedAt: now },
    });
}
