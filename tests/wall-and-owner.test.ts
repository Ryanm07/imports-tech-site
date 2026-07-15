import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  isReservedDisplayName,
  statusForRisk,
  toPublicWallTopic,
  validateWallReply,
  validateWallTopic,
  WALL_CATEGORY_FALLBACKS,
} from "../lib/wall-domain";
import {
  getVisitorIdentity,
  honeypotWasFilled,
  parseLimitedJson,
  verifyTurnstile,
} from "../lib/visitor-security";
import {
  canTargetOwnerAccount,
  isConfiguredOwnerEmail,
  parseOwnerEmails,
  PUBLIC_OWNER,
} from "../lib/owner-domain";
import { validTelegramUrl } from "../lib/telegram";
import { shouldShowIntro } from "../lib/intro";

test("nomes reservados bloqueiam variações e o perfil oficial é fixo", () => {
  for (const name of [
    "Imports Tech",
    "IMPORTS_TECH",
    "R y a n",
    "admin123",
    "Suporte Imports Tech",
  ]) {
    assert.equal(isReservedDisplayName(name), true, name);
  }
  assert.equal(isReservedDisplayName("Mariana Tech"), false);
  assert.equal(PUBLIC_OWNER.displayName, "Ryan — Imports Tech");
});

test("categorias versionadas sustentam os quatro comandos rápidos", () => {
  const categories = new Map(
    WALL_CATEGORY_FALLBACKS.map((item) => [item.name, item.id]),
  );
  assert.equal(categories.get("Sugestões de vídeo"), "sugestoes-video");
  assert.equal(categories.get("Garimpos e OLX"), "garimpos-olx");
  assert.equal(categories.get("Ajuda técnica"), "ajuda-tecnica");
  assert.equal(categories.get("Assuntos gerais"), "assuntos-gerais");
});

test("validação do mural aplica comprimentos, links, Unicode e classificação", () => {
  const valid = validateWallTopic({
    displayName: "  João  ",
    categoryId: "celulares",
    title: "Dúvida sobre bateria",
    body: "Alguém já testou este aparelho durante um dia inteiro?",
  });
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.value.displayName, "João");
    assert.equal(statusForRisk(valid.risk), "published");
  }

  const suspicious = validateWallTopic({
    displayName: "Pessoa",
    categoryId: "celulares",
    title: "Uma dúvida normal sobre bateria",
    body: "Esta dúvida contém aaaaaaaaaaaa caracteres repetidos e precisa passar por revisão.",
  });
  assert.equal(suspicious.ok, true);
  if (suspicious.ok) assert.equal(statusForRisk(suspicious.risk), "pending");

  const xss = validateWallTopic({
    displayName: "Pessoa",
    categoryId: "celulares",
    title: "Dúvida com script",
    body: "<script>alert(1)</script> Conteúdo que tenta executar código.",
  });
  assert.equal(xss.ok, true);
  if (xss.ok) assert.equal(statusForRisk(xss.risk), "spam");

  const links = validateWallReply({
    displayName: "Pessoa",
    body: "Veja https://example.com e https://example.org",
  });
  assert.equal(links.ok, false);
});

test("DTO público do mural não expõe hash ou campos privados", () => {
  const topic = toPublicWallTopic({
    id: "t1",
    categoryId: "celulares",
    categoryName: "Celulares",
    categoryDescription: null,
    categoryStatus: "active",
    displayName: "Pessoa",
    title: "Título válido",
    body: "Mensagem pública suficientemente longa.",
    isOfficial: false,
    replyCount: 0,
    closedAt: null,
    pinnedAt: null,
    createdAt: "2026-07-14T00:00:00.000Z",
    updatedAt: "2026-07-14T00:00:00.000Z",
  });
  const json = JSON.stringify(topic);
  assert.equal(json.includes("identityHash"), false);
  assert.equal(topic.author.label, "Nome informado pelo visitante");
});

test("hash de origem falha fechado e nunca contém o endereço simples", async () => {
  const request = new Request("https://site.example", {
    headers: { "cf-connecting-ip": "203.0.113.8" },
  });
  assert.deepEqual(await getVisitorIdentity(request, { salt: "curto" }), {
    ok: false,
    reason: "missing-salt",
  });
  const result = await getVisitorIdentity(request, {
    salt: "um-segredo-de-teste-com-mais-de-24-caracteres",
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.match(result.hash, /^[a-f0-9]{64}$/);
    assert.equal(result.hash.includes("203.0.113.8"), false);
  }
});

test("Turnstile, body limitado e honeypot falham de forma segura", async () => {
  assert.deepEqual(
    await verifyTurnstile("token-valido-de-teste", { secret: "" }),
    { ok: false, reason: "unavailable" },
  );
  const verified = await verifyTurnstile("token-valido-de-teste", {
    secret: "secret",
    fetcher: async () => Response.json({ success: true }),
  });
  assert.deepEqual(verified, { ok: true });
  const tooLarge = await parseLimitedJson(
    new Request("https://site.example", {
      method: "POST",
      body: JSON.stringify({ body: "x".repeat(200) }),
    }),
    50,
  );
  assert.deepEqual(tooLarge, { ok: false, reason: "too-large" });
  assert.equal(honeypotWasFilled({ website: "bot.example" }), true);
});

test("OWNER_EMAILS é fonte de recuperação e conta nunca é alvo", () => {
  assert.deepEqual(
    [...parseOwnerEmails(" Owner@Example.com,second@example.com ")],
    ["owner@example.com", "second@example.com"],
  );
  assert.equal(
    isConfiguredOwnerEmail("OWNER@example.com", "owner@example.com"),
    true,
  );
  assert.equal(canTargetOwnerAccount(), false);
});

test("Telegram aceita somente links HTTPS oficiais", () => {
  assert.equal(
    validTelegramUrl("https://t.me/importstech"),
    "https://t.me/importstech",
  );
  assert.equal(validTelegramUrl("http://t.me/importstech"), null);
  assert.equal(validTelegramUrl("https://evil.example/importstech"), null);
});

test("flags de produção permanecem explicitamente desligadas", async () => {
  const env = await readFile(
    new URL("../.env.example", import.meta.url),
    "utf8",
  );
  for (const flag of [
    "COMMUNITY_ENABLED=false",
    "ADMIN_ENABLED=false",
    "EDITORIAL_DB_ENABLED=false",
    "INTRO_ENABLED=false",
  ]) {
    assert.equal(env.includes(flag), true, flag);
  }
});

test("intro falha silenciosamente para flag, arquivo, sessão, movimento e conexão", () => {
  const base = {
    enabled: true,
    replay: false,
    seenThisSession: false,
    reducedMotion: false,
    saveData: false,
    effectiveType: "4g",
    hasPlayableAsset: true,
  };
  assert.equal(shouldShowIntro(base), true);
  assert.equal(shouldShowIntro({ ...base, enabled: false }), false);
  assert.equal(shouldShowIntro({ ...base, hasPlayableAsset: false }), false);
  assert.equal(shouldShowIntro({ ...base, seenThisSession: true }), false);
  assert.equal(
    shouldShowIntro({ ...base, seenThisSession: true, replay: true }),
    true,
  );
  assert.equal(shouldShowIntro({ ...base, reducedMotion: true }), false);
  assert.equal(shouldShowIntro({ ...base, saveData: true }), false);
  assert.equal(shouldShowIntro({ ...base, effectiveType: "2g" }), false);
});
