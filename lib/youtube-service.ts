import { eq } from "drizzle-orm";
import { youtubeSnapshots } from "@/db/schema";
import { classifyVideo, type VideoCategory } from "@/lib/video-taxonomy";

export const YOUTUBE_CHANNEL_ID =
  process.env.YOUTUBE_CHANNEL_ID || "UCzCdaGidi49uW9eJEXs9M4A";
export const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@Imports_Tech";

export type YouTubeVideo = {
  id: string;
  title: string;
  views: number;
  publishedAt: string;
  duration: string;
  thumbnail: string;
  category: VideoCategory;
  tags: VideoCategory[];
  description: string;
  keywords: string[];
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
  source: "youtube-api" | "youtube-feed" | "snapshot";
  isStale: boolean;
  isPartial: boolean;
  lastSuccessfulSyncAt: string | null;
  syncedAt: string;
  videos: YouTubeVideo[];
};

type Fetcher = typeof fetch;
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
    thumbnails?: {
      maxres?: { url?: string };
      high?: { url?: string };
    };
  };
  statistics?: {
    subscriberCount?: string;
    viewCount?: string;
    videoCount?: string;
  };
};
type YouTubeApiResponse = {
  items?: YouTubeApiItem[];
  nextPageToken?: string;
};

const snapshotVideos: YouTubeVideo[] = [
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
  [
    "4gf5vtyihyU",
    "O Notebook Gamer de R$961,89 que NINGUÉM teria coragem de comprar… (eu comprei)",
    35000,
    "2026-06-03",
    "",
  ],
  [
    "WMQfOCaop-w",
    "Comprei uma Lucky Box de Fones no AliExpress… Tomei golpe?",
    477,
    "2026-05-27",
    "",
  ],
  [
    "UtcI5DhUlaQ",
    "Usei um iPhone XR em pleno 2026… não foi o que eu esperava",
    8600,
    "2026-05-20",
    "",
  ],
  [
    "Omm5Leo1WMM",
    "Comprei um iPhone 11 BARATO… e deu MUITO errado",
    5600,
    "2026-05-13",
    "",
  ],
].map(([id, title, views, publishedAt, duration]) => {
  const taxonomy = classifyVideo(String(title), String(id));
  return {
    id: String(id),
    title: String(title),
    views: Number(views),
    publishedAt: String(publishedAt),
    duration: String(duration),
    thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    ...taxonomy,
    description: String(title),
    keywords: taxonomy.tags,
  };
});

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
  source: "snapshot",
  isStale: true,
  isPartial: true,
  lastSuccessfulSyncAt: "2026-07-10T00:00:00.000Z",
  syncedAt: "2026-07-10T00:00:00.000Z",
  videos: snapshotVideos,
};

let memoryCache: { data: YouTubeData; expiresAt: number } | null = null;

export async function getYouTubeData() {
  if (memoryCache && memoryCache.expiresAt > Date.now())
    return memoryCache.data;
  const now = new Date();
  try {
    const data = process.env.YOUTUBE_API_KEY
      ? await fetchYouTubeApi({
          apiKey: process.env.YOUTUBE_API_KEY,
          channelId: YOUTUBE_CHANNEL_ID,
          fetcher: fetch,
          now,
        })
      : await fetchYouTubeFeed({
          channelId: YOUTUBE_CHANNEL_ID,
          fetcher: fetch,
          now,
        });
    memoryCache = { data, expiresAt: Date.now() + 15 * 60_000 };
    await savePersistentSnapshot(data);
    return data;
  } catch {
    const persisted = await loadPersistentSnapshot();
    if (persisted) {
      const data = { ...persisted, isStale: true };
      memoryCache = { data, expiresAt: Date.now() + 5 * 60_000 };
      return data;
    }
    return versionedSnapshot;
  }
}

export async function fetchYouTubeApi({
  apiKey,
  channelId,
  fetcher,
  now,
}: {
  apiKey: string;
  channelId: string;
  fetcher: Fetcher;
  now: Date;
}): Promise<YouTubeData> {
  const channel = await fetchJson(
    fetcher,
    "https://www.googleapis.com/youtube/v3/channels",
    {
      part: "snippet,statistics,contentDetails",
      id: channelId,
      key: apiKey,
    },
  );
  const channelItem = channel.items?.[0];
  if (!channelItem?.contentDetails?.relatedPlaylists?.uploads) {
    throw new Error("Canal ou playlist de uploads indisponível.");
  }

  const uploadIds: string[] = [];
  let pageToken: string | undefined;
  do {
    const page = await fetchJson(
      fetcher,
      "https://www.googleapis.com/youtube/v3/playlistItems",
      {
        part: "contentDetails",
        playlistId: channelItem.contentDetails.relatedPlaylists.uploads,
        maxResults: "50",
        key: apiKey,
        ...(pageToken ? { pageToken } : {}),
      },
    );
    for (const item of page.items || []) {
      if (item.contentDetails?.videoId)
        uploadIds.push(item.contentDetails.videoId);
    }
    pageToken = page.nextPageToken || undefined;
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
        key: apiKey,
      },
    );
    for (const item of page.items || []) {
      if (!item.id) continue;
      const taxonomy = classifyVideo(item.snippet?.title || "", item.id);
      details.set(item.id, {
        id: item.id,
        title: item.snippet?.title || "Vídeo sem título",
        views: Number(item.statistics?.viewCount || 0),
        publishedAt: item.snippet?.publishedAt || "",
        duration: isoDuration(item.contentDetails?.duration),
        thumbnail:
          item.snippet?.thumbnails?.maxres?.url ||
          item.snippet?.thumbnails?.high?.url ||
          `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
        ...taxonomy,
        description: item.snippet?.description || "",
        keywords: Array.isArray(item.snippet?.tags)
          ? item.snippet.tags.slice(0, 30)
          : taxonomy.tags,
      });
    }
  }

  const videos = uploadIds.flatMap((id) =>
    details.has(id) ? [details.get(id)!] : [],
  );
  const syncedAt = now.toISOString();
  return {
    channelName: channelItem.snippet?.title || "Imports Tech!",
    handle: channelItem.snippet?.customUrl || "@Imports_Tech",
    description:
      channelItem.snippet?.description?.split("\n")[0] ||
      versionedSnapshot.description,
    subscribers: Number(channelItem.statistics?.subscriberCount || 0),
    totalViews: Number(channelItem.statistics?.viewCount || 0),
    videoCount: Number(channelItem.statistics?.videoCount || videos.length),
    monthlyGrowth: 0,
    channelUrl: YOUTUBE_CHANNEL_URL,
    source: "youtube-api",
    isStale: false,
    isPartial: videos.length < Number(channelItem.statistics?.videoCount || 0),
    lastSuccessfulSyncAt: syncedAt,
    syncedAt,
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
    throw new Error(`YouTube feed respondeu ${response.status}.`);
  const feed = await response.text();
  const entries = [...feed.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(
    0,
    15,
  );
  const videos = entries.flatMap((entry) => {
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
      },
    ];
  });
  if (!videos.length) throw new Error("Feed sem vídeos válidos.");
  const syncedAt = now.toISOString();
  return {
    ...versionedSnapshot,
    source: "youtube-feed",
    isStale: false,
    isPartial: true,
    lastSuccessfulSyncAt: syncedAt,
    syncedAt,
    videos,
  };
}

async function fetchJson(
  fetcher: Fetcher,
  base: string,
  params: Record<string, string>,
): Promise<YouTubeApiResponse> {
  const url = new URL(base);
  url.search = new URLSearchParams(params).toString();
  const response = await fetchWithTimeout(fetcher, url);
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `YouTube API respondeu ${response.status}: ${detail.slice(0, 160)}`,
    );
  }
  const data = await response.json();
  if (!data || typeof data !== "object")
    throw new Error("Resposta incompleta do YouTube.");
  return data as YouTubeApiResponse;
}

async function fetchWithTimeout(fetcher: Fetcher, input: string | URL) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    return await fetcher(input, {
      cache: "no-store",
      signal: controller.signal,
      headers: { "Accept-Language": "pt-BR,pt;q=0.9" },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function savePersistentSnapshot(data: YouTubeData) {
  try {
    const { getDb } = await import("@/db");
    const now = new Date().toISOString();
    await getDb()
      .insert(youtubeSnapshots)
      .values({
        channelId: YOUTUBE_CHANNEL_ID,
        payload: JSON.stringify(data),
        source: data.source === "youtube-api" ? "youtube-api" : "youtube-feed",
        lastSuccessfulSyncAt: data.lastSuccessfulSyncAt || now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: youtubeSnapshots.channelId,
        set: {
          payload: JSON.stringify(data),
          source:
            data.source === "youtube-api" ? "youtube-api" : "youtube-feed",
          lastSuccessfulSyncAt: data.lastSuccessfulSyncAt || now,
          updatedAt: now,
        },
      });
  } catch {
    // The versioned snapshot remains available if D1 is absent or not migrated.
  }
}

async function loadPersistentSnapshot() {
  try {
    const { getDb } = await import("@/db");
    const rows = await getDb()
      .select({ payload: youtubeSnapshots.payload })
      .from(youtubeSnapshots)
      .where(eq(youtubeSnapshots.channelId, YOUTUBE_CHANNEL_ID))
      .limit(1);
    return rows[0] ? (JSON.parse(rows[0].payload) as YouTubeData) : null;
  } catch {
    return null;
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
