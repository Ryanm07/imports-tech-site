import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { normalizeSearch, searchVideos, sortVideos } from "../lib/search.ts";
import { sanitizePlainText, validateCommunityPost } from "../lib/security.ts";

test("gera o worker e mantém as rotas públicas essenciais", async () => {
  await access(new URL("../dist/server/index.js", import.meta.url));
  const routes = [["../app/home-page.tsx", "Tecnologia testada"], ["../app/videos/page.tsx", "BIBLIOTECA DO CANAL"], ["../app/reviews/page.tsx", "CENTRAL DE REVIEWS"], ["../app/garimpos/page.tsx", "GARIMPOS E REPAROS"]];
  for (const [path, content] of routes) assert.match(await readFile(new URL(path, import.meta.url), "utf8"), new RegExp(content, "i"), path);
});

test("mantém recursos sensíveis desativados por padrão", async () => {
  const community = await readFile(new URL("../app/comunidade/page.tsx", import.meta.url), "utf8"); assert.match(community, /COMMUNITY_ENABLED/); assert.match(community, /Comunidade em breve/i);
  const admin = await readFile(new URL("../app/admin/page.tsx", import.meta.url), "utf8"); assert.match(admin, /ADMIN_ENABLED/); assert.match(admin, /Painel administrativo desativado/i);
  const env = await readFile(new URL("../.env.example", import.meta.url), "utf8"); assert.match(env, /COMMUNITY_ENABLED=false/); assert.match(env, /ADMIN_ENABLED=false/);
});

test("pesquisa e ordena vídeos sem rede", () => {
  const videos = [{ id:"1",title:"iPhone 12 usado",category:"Smartphones",views:10,publishedAt:"2026-01-01" },{ id:"2",title:"Notebook da OLX",category:"Garimpos",views:50,publishedAt:"2026-02-01" }];
  assert.equal(normalizeSearch("  Câmera "), "camera");
  assert.equal(searchVideos(videos, "iphone", "Todos")[0].id, "1");
  assert.equal(searchVideos(videos, "olx", "Garimpos")[0].id, "2");
  assert.equal(sortVideos(videos, "vistos")[0].id, "2");
});

test("sanitiza e valida publicações", () => {
  assert.equal(sanitizePlainText("<script>alert(1)</script> Texto", 100), "alert(1) Texto");
  assert.ok(validateCommunityPost("curto", "também curto").errors.length >= 2);
  assert.ok(validateCommunityPost("Título válido", "Texto útil com https://a.com https://b.com https://c.com").errors.some((item) => /dois links/.test(item)));
});

test("rotas administrativas validam autorização no servidor", async () => {
  const source = await readFile(new URL("../app/api/admin/content/route.ts", import.meta.url), "utf8");
  assert.match(source, /requireAdminApi/); assert.match(source, /sameOriginRequest/); assert.match(source, /moderationActions/);
});
