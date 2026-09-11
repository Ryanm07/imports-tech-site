import assert from "node:assert/strict";
import test from "node:test";
import {
  fetchYouTubeChannelMetrics,
  currentYouTubeMetrics,
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

test("conferência manual identifica sua origem sem fingir uma sincronização da API", () => {
  const snapshot = getVersionedYouTubeMetricsSnapshot();
  assert.equal(snapshot.source, "snapshot");
  assert.equal(snapshot.lastSuccessfulSyncAt, null);
  assert.equal(snapshot.subscribersApproximate, true);
});

test("números vencidos, com data inválida ou futura não são apresentados como atuais", () => {
  const snapshot = getVersionedYouTubeMetricsSnapshot();
  const now = new Date("2026-09-12T12:00:00Z");
  for (const updatedAt of [
    null,
    "inválida",
    "2026-09-11T23:59:59Z",
    "2026-09-13T12:00:00Z",
  ]) {
    const result = currentYouTubeMetrics(
      { ...snapshot, updatedAt, stale: false },
      now,
    );
    assert.equal(result.source, "unavailable");
    assert.equal(result.updatedAt, null);
    assert.equal(result.subscribers, null);
    assert.equal(result.totalViews, null);
    assert.equal(result.videoCount, null);
    assert.equal(result.stale, true);
  }
});

test("consulta recente preserva números oficiais e uma falha invalida o retrato", () => {
  const snapshot = {
    ...getVersionedYouTubeMetricsSnapshot(),
    updatedAt: "2026-09-12T11:00:00Z",
    stale: false,
  };
  const now = new Date("2026-09-12T12:00:00Z");
  assert.deepEqual(currentYouTubeMetrics(snapshot, now), snapshot);
  assert.equal(
    currentYouTubeMetrics({ ...snapshot, stale: true }, now).totalViews,
    null,
  );
});

function json(value: unknown) {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
