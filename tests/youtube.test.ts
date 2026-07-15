import assert from "node:assert/strict";
import test from "node:test";
import {
  fetchYouTubeChannelMetrics,
  getVersionedYouTubeMetricsSnapshot,
} from "../lib/youtube-service";

test("YouTube consulta somente channels.list e preserva as métricas oficiais", async () => {
  const calls: URL[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    calls.push(url);
    assert.equal(
      new Headers(init?.headers).get("x-goog-api-key"),
      "server-secret",
    );
    assert.equal(url.searchParams.has("key"), false);
    return json({
      items: [
        {
          id: "official-channel",
          snippet: {
            title: "Imports Tech!",
            customUrl: "@Imports_Tech",
            description: "Linha pública do canal\nTexto adicional.",
          },
          statistics: {
            subscriberCount: "3340",
            viewCount: "610472",
            videoCount: "80",
          },
        },
      ],
    });
  };

  const result = await fetchYouTubeChannelMetrics({
    apiKey: "server-secret",
    channelId: "official-channel",
    fetcher,
    now: new Date("2026-07-14T12:00:00.000Z"),
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].pathname, "/youtube/v3/channels");
  assert.equal(calls[0].searchParams.get("part"), "snippet,statistics");
  assert.equal(calls[0].searchParams.get("id"), "official-channel");
  assert.equal(result.subscribers, 3340);
  assert.equal(result.totalViews, 610472);
  assert.equal(result.videoCount, 80);
  assert.equal(result.description, "Linha pública do canal");
  assert.equal(result.source, "youtube-api");
  assert.equal(result.stale, false);
});

test("inscritos ocultos não são inventados", async () => {
  const result = await fetchYouTubeChannelMetrics({
    apiKey: "test-key",
    channelId: "channel",
    fetcher: async () =>
      json({
        items: [
          {
            snippet: { title: "Imports Tech!" },
            statistics: {
              hiddenSubscriberCount: true,
              viewCount: "100",
              videoCount: "3",
            },
          },
        ],
      }),
  });
  assert.equal(result.subscribers, null);
  assert.equal(result.totalViews, 100);
});

test("configuração ausente e canal não encontrado falham de forma explícita", async () => {
  await assert.rejects(
    fetchYouTubeChannelMetrics({ apiKey: "", channelId: "channel" }),
    /missing-api-key/,
  );
  await assert.rejects(
    fetchYouTubeChannelMetrics({
      apiKey: "test-key",
      channelId: "channel",
      fetcher: async () => json({ items: [] }),
    }),
    /channel-not-found/,
  );
  await assert.rejects(
    fetchYouTubeChannelMetrics({
      apiKey: "test-key",
      channelId: "channel",
      fetcher: async () => new Response("offline", { status: 503 }),
    }),
    /youtube-api-error/,
  );
});

test("snapshot versionado permanece antigo e não finge sincronização atual", () => {
  const snapshot = getVersionedYouTubeMetricsSnapshot();
  assert.equal(snapshot.source, "snapshot");
  assert.equal(snapshot.stale, true);
  assert.equal(snapshot.updatedAt, "2026-07-10T00:00:00.000Z");
});

function json(value: unknown) {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
