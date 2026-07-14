import assert from "node:assert/strict";
import test from "node:test";
import { classifyVideo } from "../lib/video-taxonomy";
import {
  fetchYouTubeApi,
  getVersionedYouTubeSnapshot,
} from "../lib/youtube-service";

test("categorias respeitam prioridades e múltiplas tags em títulos reais", () => {
  assert.deepEqual(
    classifyVideo("Paguei R$2.500 no MacBook").category,
    "Notebooks",
  );
  const olx = classifyVideo("Comprei um notebook gamer na OLX");
  assert.equal(olx.category, "Notebooks");
  assert.ok(olx.tags.includes("OLX") && olx.tags.includes("Garimpos"));
  const comparison = classifyVideo("S20 Ultra vs S26 Ultra");
  assert.equal(comparison.category, "Comparativos");
  assert.ok(comparison.tags.includes("Smartphones"));
  const repair = classifyVideo("Reparei um Galaxy com tela quebrada");
  assert.equal(repair.category, "Reparos");
  assert.ok(repair.tags.includes("Smartphones"));
});

test("YouTube API pagina uploads, busca detalhes em lote e preserva ordem", async () => {
  const calls: URL[] = [];
  const fetcher: typeof fetch = async (input) => {
    const url = new URL(String(input));
    calls.push(url);
    if (url.pathname.endsWith("/channels")) {
      return json({
        items: [
          {
            snippet: {
              title: "Imports Tech",
              customUrl: "@Imports_Tech",
              description: "Canal",
            },
            statistics: {
              subscriberCount: "10",
              viewCount: "100",
              videoCount: "3",
            },
            contentDetails: { relatedPlaylists: { uploads: "uploads-id" } },
          },
        ],
      });
    }
    if (url.pathname.endsWith("/playlistItems")) {
      return url.searchParams.get("pageToken") === "next"
        ? json({ items: [{ contentDetails: { videoId: "ccccccccccc" } }] })
        : json({
            items: [
              { contentDetails: { videoId: "aaaaaaaaaaa" } },
              { contentDetails: { videoId: "bbbbbbbbbbb" } },
            ],
            nextPageToken: "next",
          });
    }
    const ids = (url.searchParams.get("id") || "").split(",");
    return json({
      items: [...ids].reverse().map((id, index) => ({
        id,
        snippet: {
          title: `Vídeo ${id}`,
          publishedAt: `2026-07-${String(index + 10).padStart(2, "0")}T00:00:00Z`,
          thumbnails: {
            high: { url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` },
          },
        },
        contentDetails: { duration: "PT10M5S" },
        statistics: { viewCount: "50" },
      })),
    });
  };

  const result = await fetchYouTubeApi({
    apiKey: "test-key",
    channelId: "channel",
    fetcher,
    now: new Date("2026-07-14T12:00:00.000Z"),
  });
  assert.deepEqual(
    result.videos.map((video) => video.id),
    ["aaaaaaaaaaa", "bbbbbbbbbbb", "ccccccccccc"],
  );
  assert.equal(result.isPartial, false);
  assert.equal(result.source, "youtube-api");
  assert.equal(
    calls.filter((url) => url.pathname.endsWith("/playlistItems")).length,
    2,
  );
  assert.equal(
    calls.filter((url) => url.pathname.endsWith("/videos")).length,
    1,
  );
});

test("snapshot versionado permanece stale e não finge sincronização atual", () => {
  const snapshot = getVersionedYouTubeSnapshot();
  assert.equal(snapshot.source, "snapshot");
  assert.equal(snapshot.isStale, true);
  assert.equal(snapshot.isPartial, true);
  assert.equal(snapshot.syncedAt, "2026-07-10T00:00:00.000Z");
});

function json(value: unknown) {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
