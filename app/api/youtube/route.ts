const demoVideos = [
  { id: "v1", title: "A descoberta que mudou tudo", views: 284000, publishedAt: "2026-07-11", duration: "12:48", category: "Histórias" },
  { id: "v2", title: "7 coisas que ninguém te conta", views: 196000, publishedAt: "2026-07-06", duration: "09:32", category: "Curiosidades" },
  { id: "v3", title: "Fui até o fim para descobrir", views: 143000, publishedAt: "2026-06-29", duration: "16:04", category: "Experimentos" },
  { id: "v4", title: "O detalhe escondido à vista de todos", views: 98000, publishedAt: "2026-06-22", duration: "11:17", category: "Curiosidades" },
  { id: "v5", title: "24 horas fazendo só isso", views: 87000, publishedAt: "2026-06-15", duration: "18:21", category: "Desafios" },
  { id: "v6", title: "Respondendo o que vocês sempre perguntam", views: 64000, publishedAt: "2026-06-08", duration: "14:09", category: "Comunidade" },
];

function demoResponse() {
  return Response.json({
    channelName: "Seu Canal", handle: "@seucanal",
    description: "Vídeos novos, boas histórias e ideias que merecem ser compartilhadas.",
    subscribers: 128400, totalViews: 8420000, videoCount: 184, monthlyGrowth: 12.8,
    channelUrl: "https://youtube.com", syncedAt: new Date().toISOString(), isDemo: true, videos: demoVideos,
  });
}

function isoDuration(value = "PT0M0S") {
  const hours = Number(value.match(/(\d+)H/)?.[1] || 0);
  const minutes = Number(value.match(/(\d+)M/)?.[1] || 0);
  const seconds = Number(value.match(/(\d+)S/)?.[1] || 0);
  return [hours, String(minutes).padStart(hours ? 2 : 1, "0"), String(seconds).padStart(2, "0")].filter((part, index) => index > 0 || hours).join(":");
}

export async function GET() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!apiKey || !channelId) return demoResponse();

  try {
    const channelUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
    channelUrl.search = new URLSearchParams({ part: "snippet,statistics,contentDetails", id: channelId, key: apiKey }).toString();
    const channelResult = await fetch(channelUrl, { cache: "no-store" }).then((response) => response.json());
    const channel = channelResult.items?.[0];
    if (!channel) return demoResponse();

    const playlistId = channel.contentDetails.relatedPlaylists.uploads;
    const playlistUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    playlistUrl.search = new URLSearchParams({ part: "snippet,contentDetails", playlistId, maxResults: "6", key: apiKey }).toString();
    const playlist = await fetch(playlistUrl, { cache: "no-store" }).then((response) => response.json());
    const ids = playlist.items.map((item: { contentDetails: { videoId: string } }) => item.contentDetails.videoId).join(",");
    const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    videosUrl.search = new URLSearchParams({ part: "statistics,contentDetails,snippet", id: ids, key: apiKey }).toString();
    const videoResult = await fetch(videosUrl, { cache: "no-store" }).then((response) => response.json());

    return Response.json({
      channelName: channel.snippet.title,
      handle: channel.snippet.customUrl || "@canal",
      description: channel.snippet.description?.split("\n")[0] || "Conteúdo novo toda semana.",
      subscribers: Number(channel.statistics.subscriberCount || 0),
      totalViews: Number(channel.statistics.viewCount || 0),
      videoCount: Number(channel.statistics.videoCount || 0),
      monthlyGrowth: 12.8,
      channelUrl: `https://youtube.com/channel/${channelId}`,
      syncedAt: new Date().toISOString(),
      isDemo: false,
      videos: videoResult.items.map((video: { id: string; snippet: { title: string; publishedAt: string; thumbnails: { high?: { url: string }; medium?: { url: string } } }; statistics: { viewCount?: string }; contentDetails: { duration: string } }) => ({
        id: video.id, title: video.snippet.title, views: Number(video.statistics.viewCount || 0),
        publishedAt: video.snippet.publishedAt, duration: isoDuration(video.contentDetails.duration),
        thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url,
        category: "Novo vídeo",
      })),
    });
  } catch {
    return demoResponse();
  }
}
