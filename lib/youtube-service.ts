import { eq } from "drizzle-orm";
import { youtubeChannelState, youtubeSyncRuns } from "@/db/schema";
import { BRAND_LINKS } from "@/lib/brand";

export const YOUTUBE_CHANNEL_ID =
  process.env.YOUTUBE_CHANNEL_ID || "UCzCdaGidi49uW9eJEXs9M4A";

export type YouTubeMetricsSnapshot = {
  channelId: string;
  channelName: string;
  handle: string;
  description: string;
  subscribers: number | null;
  totalViews: number | null;
  videoCount: number | null;
  source: "youtube-api" | "snapshot" | "unavailable";
  updatedAt: string | null;
  stale: boolean;
  syncStatus: "idle" | "running" | "failed";
  lastAttemptAt: string | null;
  lastSuccessfulSyncAt: string | null;
  lastError: string | null;
  channelUrl: string;
};

type Fetcher = typeof fetch;
type SyncTrigger = "cron" | "manual";
type ChannelApiItem = {
  id?: string;
  snippet?: {
    title?: string;
    customUrl?: string;
    description?: string;
  };
  statistics?: {
    subscriberCount?: string;
    viewCount?: string;
    videoCount?: string;
    hiddenSubscriberCount?: boolean;
  };
};

const SNAPSHOT_AT = "2026-07-10T00:00:00.000Z";
const STALE_AFTER_MS = 12 * 60 * 60_000;

const versionedSnapshot: YouTubeMetricsSnapshot = {
  channelId: YOUTUBE_CHANNEL_ID,
  channelName: "Imports Tech!",
  handle: "@Imports_Tech",
  description:
    "Tecnologia de verdade, sem enrolação: reviews, testes no uso real, usados, garimpos e custo-benefício.",
  subscribers: 3340,
  totalViews: 610472,
  videoCount: 80,
  source: "snapshot",
  updatedAt: SNAPSHOT_AT,
  stale: true,
  syncStatus: "idle",
  lastAttemptAt: SNAPSHOT_AT,
  lastSuccessfulSyncAt: SNAPSHOT_AT,
  lastError: null,
  channelUrl: BRAND_LINKS.youtube,
};

export async function getYouTubeMetrics(): Promise<YouTubeMetricsSnapshot> {
  try {
    const { getDb } = await import("@/db");
    const rows = await getDb()
      .select()
      .from(youtubeChannelState)
      .where(eq(youtubeChannelState.channelId, YOUTUBE_CHANNEL_ID))
      .limit(1);
    const state = rows[0];
    if (!state || !state.metricsUpdatedAt) return versionedSnapshot;
    const source = state.metricsSource;
    const stale =
      source !== "youtube-api" ||
      state.metricsStale ||
      isOlderThan(state.metricsUpdatedAt, Date.now(), STALE_AFTER_MS);
    return {
      channelId: state.channelId,
      channelName: state.channelName || versionedSnapshot.channelName,
      handle: state.handle || versionedSnapshot.handle,
      description: state.description || versionedSnapshot.description,
      subscribers: source === "unavailable" ? null : state.subscribers,
      totalViews: source === "unavailable" ? null : state.totalViews,
      videoCount: source === "unavailable" ? null : state.videoCount,
      source,
      updatedAt: state.metricsUpdatedAt,
      stale,
      syncStatus: state.syncStatus,
      lastAttemptAt: state.lastAttemptAt,
      lastSuccessfulSyncAt: state.lastSuccessAt,
      lastError: state.lastError,
      channelUrl: BRAND_LINKS.youtube,
    };
  } catch {
    return versionedSnapshot;
  }
}

export async function fetchYouTubeChannelMetrics({
  apiKey,
  channelId,
  fetcher = fetch,
  now = new Date(),
}: {
  apiKey: string;
  channelId: string;
  fetcher?: Fetcher;
  now?: Date;
}): Promise<YouTubeMetricsSnapshot> {
  if (!apiKey) throw new YouTubeMetricsError("missing-api-key");
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.search = new URLSearchParams({
    part: "snippet,statistics",
    id: channelId,
  }).toString();
  const response = await fetchWithTimeout(fetcher, url, {
    "X-Goog-Api-Key": apiKey,
  });
  if (!response.ok) throw new YouTubeMetricsError("youtube-api-error");
  const data = (await response.json()) as { items?: ChannelApiItem[] };
  const channel = data.items?.[0];
  if (!channel) throw new YouTubeMetricsError("channel-not-found");
  const hiddenSubscribers = channel.statistics?.hiddenSubscriberCount === true;
  return {
    channelId: channel.id || channelId,
    channelName: channel.snippet?.title || "Imports Tech!",
    handle: channel.snippet?.customUrl || "@Imports_Tech",
    description: channel.snippet?.description?.split("\n")[0] || "",
    subscribers: hiddenSubscribers
      ? null
      : optionalNumber(channel.statistics?.subscriberCount),
    totalViews: optionalNumber(channel.statistics?.viewCount),
    videoCount: optionalNumber(channel.statistics?.videoCount),
    source: "youtube-api",
    updatedAt: now.toISOString(),
    stale: false,
    syncStatus: "idle",
    lastAttemptAt: now.toISOString(),
    lastSuccessfulSyncAt: now.toISOString(),
    lastError: null,
    channelUrl: BRAND_LINKS.youtube,
  };
}

export async function runYouTubeMetricsSync({
  trigger,
  apiKey = process.env.YOUTUBE_API_KEY,
  channelId = YOUTUBE_CHANNEL_ID,
  fetcher = fetch,
  now = new Date(),
}: {
  trigger: SyncTrigger;
  apiKey?: string;
  channelId?: string;
  fetcher?: Fetcher;
  now?: Date;
}) {
  const { getD1, getDb } = await import("@/db");
  const db = getDb();
  const startedAt = now.toISOString();
  const runId = crypto.randomUUID();
  await db
    .insert(youtubeChannelState)
    .values({ channelId, updatedAt: startedAt })
    .onConflictDoNothing();
  const lockExpiresAt = new Date(now.getTime() + 5 * 60_000).toISOString();
  const locked = await getD1()
    .prepare(
      `UPDATE youtube_channel_state
       SET lock_expires_at = ?, sync_status = 'running', last_attempt_at = ?, updated_at = ?
       WHERE channel_id = ? AND (lock_expires_at IS NULL OR lock_expires_at <= ?)
       RETURNING channel_id`,
    )
    .bind(lockExpiresAt, startedAt, startedAt, channelId, startedAt)
    .first<{ channel_id: string }>();
  if (!locked) return { status: "skipped" as const, reason: "lock-active" };

  await db.insert(youtubeSyncRuns).values({
    id: runId,
    trigger,
    mode: "incremental",
    status: "running",
    startedAt,
  });

  try {
    if (!apiKey) throw new YouTubeMetricsError("missing-api-key");
    const metrics = await fetchYouTubeChannelMetrics({
      apiKey,
      channelId,
      fetcher,
      now,
    });
    await db
      .update(youtubeChannelState)
      .set({
        channelName: metrics.channelName,
        handle: metrics.handle,
        description: metrics.description,
        subscribers: metrics.subscribers,
        totalViews: metrics.totalViews,
        videoCount: metrics.videoCount,
        metricsSource: "youtube-api",
        metricsUpdatedAt: startedAt,
        metricsStale: false,
        catalogSource: "unavailable",
        catalogUpdatedAt: null,
        catalogPartial: true,
        catalogStale: true,
        indexedVideoCount: 0,
        syncStatus: "idle",
        lastAttemptAt: startedAt,
        lastSuccessAt: startedAt,
        lastError: null,
        lockExpiresAt: null,
        updatedAt: startedAt,
      })
      .where(eq(youtubeChannelState.channelId, channelId));
    await db
      .update(youtubeSyncRuns)
      .set({ status: "succeeded", completedAt: startedAt })
      .where(eq(youtubeSyncRuns.id, runId));
    return { status: "succeeded" as const, metrics };
  } catch (error) {
    const failure = sanitizeFailure(error);
    await db
      .update(youtubeChannelState)
      .set({
        metricsStale: true,
        syncStatus: "failed",
        lastAttemptAt: startedAt,
        lastError: failure.message,
        lockExpiresAt: null,
        updatedAt: startedAt,
      })
      .where(eq(youtubeChannelState.channelId, channelId));
    await db
      .update(youtubeSyncRuns)
      .set({
        status: "failed",
        completedAt: startedAt,
        errorCode: failure.code,
        errorMessage: failure.message,
      })
      .where(eq(youtubeSyncRuns.id, runId));
    return { status: "failed" as const, errorCode: failure.code };
  }
}

export function getVersionedYouTubeMetricsSnapshot() {
  return versionedSnapshot;
}

async function fetchWithTimeout(
  fetcher: Fetcher,
  input: URL,
  headers: Record<string, string>,
) {
  return fetcher(input, {
    headers,
    signal: AbortSignal.timeout(8_000),
  });
}

function optionalNumber(value: string | undefined) {
  if (value === undefined) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

function isOlderThan(value: string | null, now: number, threshold: number) {
  if (!value) return true;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) || now - timestamp > threshold;
}

function sanitizeFailure(error: unknown) {
  const code =
    error instanceof YouTubeMetricsError ? error.code : "metrics-sync-error";
  const messages: Record<string, string> = {
    "missing-api-key": "API do YouTube não configurada.",
    "youtube-api-error": "YouTube Data API temporariamente indisponível.",
    "channel-not-found": "Canal não encontrado na resposta da API.",
  };
  return { code, message: messages[code] || "Falha ao sincronizar métricas." };
}

class YouTubeMetricsError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}
