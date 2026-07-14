const CHANNEL_ID = "UCzCdaGidi49uW9eJEXs9M4A";
const CHANNEL_URL = "https://www.youtube.com/@Imports_Tech";

const snapshotVideos = [
  { id: "fnD2R4YoJ8k", title: "Velho, mas não obsoleto! Será que o iPhone 12 Ainda Vale a Pena em 2026?", views: 1100, publishedAt: "2026-07-10", duration: "14:08", category: "Smartphones" },
  { id: "i4LXDsWlc8Q", title: "Comprei um iPhone 12 por R$650… Me Dei Bem?", views: 5400, publishedAt: "2026-07-02", duration: "5:04", category: "Garimpos" },
  { id: "biatbb6rvwU", title: "Usei o Galaxy S21 Ultra em 2026… Ele Ainda é ABSURDO?", views: 5100, publishedAt: "2026-06-30", duration: "11:03", category: "Smartphones" },
  { id: "cbodYFxeINo", title: "Paguei R$2.500 no MacBook Mais Vendido do Brasil... Valeu a Pena?", views: 11000, publishedAt: "2026-06-23", duration: "13:32", category: "Notebooks" },
  { id: "ScBB5TZ-Py8", title: "Achei um S21 Ultra por R$502,89 na OLX… Eu tive que Arriscar", views: 76000, publishedAt: "2026-06-16", duration: "14:21", category: "Garimpos" },
  { id: "Y1nStLptXY0", title: "Paguei R$1.200 no notebook gamer mais vendido do Brasil... valeu a pena?", views: 243000, publishedAt: "2026-06-10", duration: "19:07", category: "Notebooks" },
].map((video) => ({ ...video, thumbnail: `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg` }));

function snapshot() {
  return {
    channelName: "Imports Tech!",
    handle: "@Imports_Tech",
    description: "Tecnologia de verdade, sem enrolação: reviews, testes no uso real, usados, garimpos e custo-benefício.",
    subscribers: 3340,
    totalViews: 610472,
    videoCount: 80,
    monthlyGrowth: 0,
    channelUrl: CHANNEL_URL,
    syncedAt: new Date().toISOString(),
    isDemo: false,
    videos: snapshotVideos,
  };
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
  return decodeText(xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`))?.[1] || "");
}

function categoryFor(title: string) {
  if (/olx|aliexpress|comprei|paguei|r\$/i.test(title)) return "Garimpos";
  if (/notebook|macbook|pc|gamer/i.test(title)) return "Notebooks";
  if (/iphone|galaxy|celular|samsung/i.test(title)) return "Smartphones";
  return "Reviews";
}

function localeCount(value: string) {
  const normalized = value.replace(/\u00a0/g, " ").toLowerCase();
  const match = normalized.match(/([\d.,]+)\s*(mil|mi)?/);
  if (!match) return 0;
  const number = Number(match[1].replace(/\./g, "").replace(",", "."));
  return Math.round(number * (match[2] === "mil" ? 1000 : match[2] === "mi" ? 1_000_000 : 1));
}

function isoDuration(value = "PT0M0S") {
  const hours = Number(value.match(/(\d+)H/)?.[1] || 0);
  const minutes = Number(value.match(/(\d+)M/)?.[1] || 0);
  const seconds = Number(value.match(/(\d+)S/)?.[1] || 0);
  return [hours, String(minutes).padStart(hours ? 2 : 1, "0"), String(seconds).padStart(2, "0")].filter((part, index) => index > 0 || hours).join(":");
}

async function publicChannelData() {
  const [feedResponse, videosResponse, aboutResponse] = await Promise.all([
    fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`, { cache: "no-store" }),
    fetch(`${CHANNEL_URL}/videos`, { cache: "no-store", headers: { "Accept-Language": "pt-BR,pt;q=0.9" } }),
    fetch(`${CHANNEL_URL}/about`, { cache: "no-store", headers: { "Accept-Language": "pt-BR,pt;q=0.9" } }),
  ]);

  const [feed, videosHtml, aboutHtml] = await Promise.all([feedResponse.text(), videosResponse.text(), aboutResponse.text()]);
  const entries = [...feed.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, 6);
  const liveVideos = entries.map((entry) => {
    const block = entry[1];
    const id = tag(block, "yt:videoId");
    const title = tag(block, "title");
    return {
      id,
      title,
      views: Number(block.match(/<media:statistics[^>]*views="(\d+)"/)?.[1] || 0),
      publishedAt: tag(block, "published"),
      duration: "NOVO",
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      category: categoryFor(title),
    };
  }).filter((video) => video.id);

  const subscribersText = videosHtml.match(/([\d.,]+(?:\s*(?:mil|mi))?)[\u00a0\s]+inscritos/i)?.[1] || "";
  const videoCount = Number(videosHtml.match(/(\d+)[\u00a0\s]+vídeos/i)?.[1] || 0);
  const publicViewCounts = [...aboutHtml.matchAll(/([\d.]+)[\u00a0\s]+visualizações/gi)].map((match) => localeCount(match[1]));
  const totalViews = Math.max(...publicViewCounts, 0);

  return {
    ...snapshot(),
    subscribers: localeCount(subscribersText) || snapshot().subscribers,
    totalViews: totalViews || snapshot().totalViews,
    videoCount: videoCount || snapshot().videoCount,
    videos: liveVideos.length ? liveVideos : snapshotVideos,
    syncedAt: new Date().toISOString(),
  };
}

async function apiChannelData(apiKey: string) {
  const channelUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
  channelUrl.search = new URLSearchParams({ part: "snippet,statistics,contentDetails", id: CHANNEL_ID, key: apiKey }).toString();
  const channelResult = await fetch(channelUrl, { cache: "no-store" }).then((response) => response.json());
  const channel = channelResult.items?.[0];
  if (!channel) throw new Error("Canal não encontrado");

  const playlistUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
  playlistUrl.search = new URLSearchParams({ part: "snippet,contentDetails", playlistId: channel.contentDetails.relatedPlaylists.uploads, maxResults: "6", key: apiKey }).toString();
  const playlist = await fetch(playlistUrl, { cache: "no-store" }).then((response) => response.json());
  const ids = playlist.items.map((item: { contentDetails: { videoId: string } }) => item.contentDetails.videoId).join(",");
  const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  videosUrl.search = new URLSearchParams({ part: "statistics,contentDetails,snippet", id: ids, key: apiKey }).toString();
  const videoResult = await fetch(videosUrl, { cache: "no-store" }).then((response) => response.json());

  return {
    channelName: channel.snippet.title,
    handle: channel.snippet.customUrl || "@Imports_Tech",
    description: channel.snippet.description?.split("\n")[0] || snapshot().description,
    subscribers: Number(channel.statistics.subscriberCount || 0),
    totalViews: Number(channel.statistics.viewCount || 0),
    videoCount: Number(channel.statistics.videoCount || 0),
    monthlyGrowth: 0,
    channelUrl: CHANNEL_URL,
    syncedAt: new Date().toISOString(),
    isDemo: false,
    videos: videoResult.items.map((video: { id: string; snippet: { title: string; publishedAt: string; thumbnails: { high?: { url: string }; medium?: { url: string } } }; statistics: { viewCount?: string }; contentDetails: { duration: string } }) => ({
      id: video.id,
      title: video.snippet.title,
      views: Number(video.statistics.viewCount || 0),
      publishedAt: video.snippet.publishedAt,
      duration: isoDuration(video.contentDetails.duration),
      thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url,
      category: categoryFor(video.snippet.title),
    })),
  };
}

export async function GET() {
  try {
    const data = process.env.YOUTUBE_API_KEY
      ? await apiChannelData(process.env.YOUTUBE_API_KEY)
      : await publicChannelData();
    return Response.json(data, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
  } catch {
    return Response.json(snapshot(), { headers: { "Cache-Control": "public, max-age=60" } });
  }
}
