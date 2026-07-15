import assert from "node:assert/strict";
import test from "node:test";
import { buildSitemap } from "../app/sitemap";
import {
  explicitContentPatch,
  validateContentPayload,
} from "../lib/content-schemas";
import { publishedReviewsFromEntries } from "../lib/content-repository";
import { safeJsonLd } from "../lib/json-ld";
import { getSiteUrl } from "../lib/site-url";
import { finds, reviews } from "../lib/site-data";
import { getVersionedYouTubeMetricsSnapshot } from "../lib/youtube-service";

test("schemas rejeitam payload arbitrário e aceitam review editorial", () => {
  assert.equal(
    validateContentPayload("review", { html: "<script>" }).ok,
    false,
  );
  const validated = validateContentPayload("review", {
    manufacturer: "Fabricante",
    category: "Smartphones",
    summary: "Resumo editorial suficientemente detalhado.",
    testedAt: "2026-07-14",
    videoId: "abcdefghijk",
    pricePaid: 123.45,
    positives: [],
    negatives: [],
    facts: [],
    status: "Publicado",
    updatedAt: "2026-07-14",
  });
  assert.equal(validated.ok, true);
  // @ts-expect-error "video" foi removido do contrato editorial ativo.
  assert.equal(validateContentPayload("video", {}).ok, false);
});

test("PATCH parcial preserva featured quando o campo é omitido", () => {
  assert.deepEqual(
    explicitContentPatch({ title: "Novo título", unrelated: true }),
    {
      title: "Novo título",
    },
  );
  assert.deepEqual(explicitContentPatch({ featured: false }), {
    featured: false,
  });
});

test("review publicada no painel substitui o fallback no repositório público", () => {
  const payload = {
    manufacturer: "Apple",
    category: "Smartphones",
    summary: "Resumo vindo do conteúdo publicado no banco editorial.",
    testedAt: "2026-07-14",
    videoId: "fnD2R4YoJ8k",
    pricePaid: 700,
    marketPrice: null,
    repairCost: null,
    totalCost: 700,
    verdict: null,
    positives: [],
    negatives: [],
    facts: [],
    status: "Atualizado no painel",
    updatedAt: "2026-07-14",
  };
  const entries = [
    {
      id: "entry-1",
      type: "review" as const,
      slug: reviews[0].slug,
      title: "Título atualizado",
      payload: JSON.stringify(payload),
      status: "published" as const,
      featured: true,
      createdById: "admin-1",
      updatedById: "admin-1",
      createdAt: "2026-07-14T00:00:00.000Z",
      updatedAt: "2026-07-14T00:00:00.000Z",
      publishedAt: "2026-07-14T00:00:00.000Z",
      deletedAt: null,
    },
  ];
  const merged = publishedReviewsFromEntries(entries);
  const review = merged.find((item) => item.slug === reviews[0].slug);
  assert.equal(review?.name, "Título atualizado");
  assert.equal(review?.status, "Atualizado no painel");
});

test("origem canônica validada não aceita host ou protocolo arbitrário", () => {
  assert.equal(
    getSiteUrl("https://example.com/path?x=1").hostname,
    "central-do-canal-2026.vsvsbssy.chatgpt.site",
  );
  assert.equal(
    getSiteUrl("javascript:alert(1)").hostname,
    "central-do-canal-2026.vsvsbssy.chatgpt.site",
  );
  assert.equal(
    getSiteUrl("http://localhost:3000/path").toString(),
    "http://localhost:3000/",
  );
});

test("JSON-LD neutraliza fechamento de script", () => {
  const serialized = safeJsonLd({
    value: "</script><script>alert(1)</script>",
  });
  assert.equal(serialized.includes("<"), false);
  assert.match(serialized, /\\u003c\/script>/);
});

test("sitemap usa datas editoriais e exclui recursos desativados", () => {
  const youtube = getVersionedYouTubeMetricsSnapshot();
  const items = buildSitemap({
    base: new URL("https://site.example"),
    reviews,
    finds,
    youtube,
    communityEnabled: false,
  });
  assert.ok(items.some((item) => item.url === "https://site.example/projetos"));
  assert.ok(items.some((item) => item.url === "https://site.example/metricas"));
  assert.equal(
    items.some((item) => item.url.includes("/videos")),
    false,
  );
  assert.equal(
    items.some((item) => item.url.includes("/garimpos/")),
    false,
  );
  assert.equal(
    items.some((item) => item.url.includes("/reviews/")),
    false,
  );
  assert.equal(
    items.some((item) => item.url.endsWith("/comunidade")),
    false,
  );
  assert.ok(items.every((item) => item.lastModified instanceof Date));
});

test("tombstones arquivados e removidos não reaparecem pelo fallback versionado", () => {
  const base = {
    id: "entry-tombstone",
    type: "review" as const,
    slug: reviews[0].slug,
    title: reviews[0].name,
    payload: "{}",
    featured: false,
    createdById: null,
    updatedById: null,
    createdAt: "2026-07-14T00:00:00.000Z",
    updatedAt: "2026-07-14T00:00:00.000Z",
    publishedAt: null,
    deletedAt: null,
  };
  for (const status of ["archived", "removed"] as const) {
    const merged = publishedReviewsFromEntries([{ ...base, status }]);
    assert.equal(
      merged.some((item) => item.slug === reviews[0].slug),
      false,
    );
  }
});

test("timeline editorial exige campos estruturados e posição inteira", () => {
  assert.equal(
    validateContentPayload("timeline", {
      year: "2026",
      title: "Novo marco",
      description: "Um marco verdadeiro e suficientemente explicado.",
      position: 2,
    }).ok,
    true,
  );
  assert.equal(
    validateContentPayload("timeline", { title: "incompleto" }).ok,
    false,
  );
});
