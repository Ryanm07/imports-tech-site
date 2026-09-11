import assert from "node:assert/strict";
import test from "node:test";
import { buildFeaturedContent } from "../lib/featured-content";
import type { Find, Review } from "../lib/site-data";

const iphoneFind: Find = {
  slug: "iphone-12-por-658-36",
  product: "Um iPhone recuperado",
  announcedPrice: null,
  negotiatedPrice: 658.36,
  announcedProblem: "Vidro traseiro danificado.",
  repairCost: 22,
  totalCost: 680,
  salePrice: null,
  reimbursement: null,
  result: "Reparo documentado.",
  currentStatus: "Publicado",
  videoId: "i4LXDsWlc8Q",
  tags: ["Smartphones", "Reparos"],
  updatedAt: "2026-07-14",
  timeline: [],
};

const macbookReview: Review = {
  slug: "macbook-air-m1-usado",
  name: "Um notebook no uso real",
  manufacturer: "Apple",
  category: "Notebooks",
  summary: "Experiência com um notebook usado.",
  testedAt: "2026-07-10",
  pricePaid: 2567,
  marketPrice: null,
  repairCost: null,
  totalCost: 2567,
  verdict: null,
  positives: [],
  negatives: [],
  scores: null,
  status: "Publicado",
  facts: [],
  updatedAt: "2026-07-14",
  videoId: "cbodYFxeINo",
};

const samsungReview: Review = {
  ...macbookReview,
  slug: "galaxy-s21-ultra-em-2026",
  name: "Um Galaxy reparado",
  manufacturer: "Samsung",
  category: "Smartphones",
  videoId: "biatbb6rvwU",
};

test("a seleção privilegia variedade mesmo quando outros itens chegam primeiro", () => {
  const otherReview = {
    ...macbookReview,
    slug: "outro-review",
    videoId: "fnD2R4YoJ8k",
  };
  const otherFind = {
    ...iphoneFind,
    slug: "outro-garimpo",
    videoId: "Y1nStLptXY0",
  };
  const selection = buildFeaturedContent(
    [otherReview, samsungReview, macbookReview],
    [otherFind, iphoneFind],
  );

  assert.deepEqual(
    selection.map(({ slug }) => slug),
    [
      "iphone-12-por-658-36",
      "macbook-air-m1-usado",
      "galaxy-s21-ultra-em-2026",
    ],
  );
  assert.deepEqual(selection[0], {
    slug: "iphone-12-por-658-36",
    title: "Um iPhone recuperado",
    summary: "Vidro traseiro danificado.",
    kind: "Garimpo",
    category: "Smartphones",
    videoId: "i4LXDsWlc8Q",
    thumbnail: "https://i.ytimg.com/vi/i4LXDsWlc8Q/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=i4LXDsWlc8Q",
  });
  assert.equal(selection[1].title, "Um notebook no uso real");
  assert.equal(selection[1].summary, "Experiência com um notebook usado.");
  assert.equal(selection[1].kind, "Review");
});

test("IDs inválidos não geram destinos e não ocupam as vagas editoriais", () => {
  for (const videoId of [
    "",
    "abcdefghij",
    "abcdefghijkl",
    "abcdefghij/",
    "abcdefghij?",
    "abcdefghij\n",
    "abcdefghijk\n",
    "https://evil.example/video",
    "javascript:alert(1)",
  ]) {
    const selection = buildFeaturedContent(
      [macbookReview],
      [{ ...iphoneFind, videoId }],
    );
    assert.deepEqual(
      selection.map(({ slug }) => slug),
      ["macbook-air-m1-usado"],
      `ID rejeitado: ${JSON.stringify(videoId)}`,
    );
  }
});

test("um vídeo duplicado libera a vaga para o próximo conteúdo disponível", () => {
  const additionalReview = {
    ...macbookReview,
    slug: "outro-notebook",
    videoId: "Y1nStLptXY0",
  };
  const selection = buildFeaturedContent(
    [
      { ...macbookReview, videoId: iphoneFind.videoId },
      samsungReview,
      additionalReview,
    ],
    [iphoneFind],
  );

  assert.deepEqual(
    selection.map(({ videoId }) => videoId),
    ["i4LXDsWlc8Q", "biatbb6rvwU", "Y1nStLptXY0"],
  );
});

test("conteúdo retirado da entrada publicada nunca reaparece como fallback", () => {
  assert.deepEqual(buildFeaturedContent([], []), []);
  const selection = buildFeaturedContent([samsungReview], []);
  assert.deepEqual(
    selection.map(({ slug }) => slug),
    ["galaxy-s21-ultra-em-2026"],
  );
});

test("as imagens e os destinos são oficiais mesmo com imageUrl editorial arbitrária", () => {
  const selection = buildFeaturedContent(
    [
      {
        ...macbookReview,
        videoId: "ScBB5TZ-Py8",
        imageUrl: "https://evil.example/tracker",
      },
    ],
    [
      {
        ...iphoneFind,
        videoId: "a_bC1dE2fG3",
        imageUrl: "data:text/html,untrusted",
      },
    ],
  );

  assert.equal(
    selection[0].thumbnail,
    "https://i.ytimg.com/vi/a_bC1dE2fG3/hqdefault.jpg",
  );
  assert.equal(selection[0].url, "https://www.youtube.com/watch?v=a_bC1dE2fG3");
  assert.equal(
    selection[1].thumbnail,
    "https://i.ytimg.com/vi/ScBB5TZ-Py8/hqdefault.jpg",
  );
  assert.equal(selection[1].url, "https://www.youtube.com/watch?v=ScBB5TZ-Py8");
});

test("a seleção não altera a ordem nem os registros fornecidos pelo repositório", () => {
  const reviews = [samsungReview, macbookReview];
  const finds = [iphoneFind];
  const before = structuredClone({ reviews, finds });
  buildFeaturedContent(reviews, finds);
  assert.deepEqual({ reviews, finds }, before);
});
