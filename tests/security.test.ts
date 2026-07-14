import assert from "node:assert/strict";
import test from "node:test";
import {
  canChangeRole,
  canManageRoles,
  canManageSettings,
  canModerate,
  publicCommunityPayload,
  resolveProfileState,
} from "../lib/community-domain";
import { consumeRateLimit, RATE_LIMITS } from "../lib/rate-limit";
import { sameOriginRequest, validateReportInput } from "../lib/security";
import type { D1DatabaseLike, D1PreparedLike } from "../lib/rate-limit";

test("DTOs públicos removem e-mail e identificadores privados", () => {
  const payload = publicCommunityPayload(
    [
      {
        id: "topic-1",
        category: "Smartphones",
        title: "Título público",
        body: "Corpo público",
        authorId: "public-random-id",
        authorDisplayName: "Visitante",
        replyCount: 1,
        createdAt: "2026-07-14T00:00:00.000Z",
        updatedAt: "2026-07-14T00:00:00.000Z",
      },
    ],
    [
      {
        id: "reply-1",
        topicId: "topic-1",
        body: "Resposta",
        authorId: "public-random-id-2",
        authorDisplayName: "Pessoa",
        createdAt: "2026-07-14T00:00:00.000Z",
        updatedAt: "2026-07-14T00:00:00.000Z",
      },
    ],
  );
  const json = JSON.stringify(payload);
  assert.equal(json.includes("authorEmail"), false);
  assert.equal(json.includes("private@example.com"), false);
  assert.deepEqual(payload.topics[0].author, {
    id: "public-random-id",
    displayName: "Visitante",
  });
});

test("proteção de origem aceita somente uma origem completa confiável", () => {
  const options = {
    siteUrl: "https://site.example",
    allowedOrigins: "https://preview.example",
    isProduction: true,
  };
  const request = (origin: string | undefined, fetchSite?: string) =>
    new Request("https://site.example/api/write", {
      method: "POST",
      headers: {
        ...(origin === undefined ? {} : { origin }),
        ...(fetchSite ? { "sec-fetch-site": fetchSite } : {}),
      },
    });

  assert.equal(
    sameOriginRequest(request("https://site.example", "same-origin"), options),
    true,
  );
  assert.equal(
    sameOriginRequest(request("https://evil.example", "cross-site"), options),
    false,
  );
  assert.equal(sameOriginRequest(request(undefined), options), false);
  assert.equal(
    sameOriginRequest(request(undefined, "same-origin"), options),
    true,
  );
  assert.equal(
    sameOriginRequest(request("null", "same-origin"), options),
    false,
  );
  assert.equal(
    sameOriginRequest(request("not a url", "same-origin"), options),
    false,
  );
});

test("matriz de permissões impede autoelevação e protege o último admin", () => {
  assert.equal(canModerate("user"), false);
  assert.equal(canModerate("moderator"), true);
  assert.equal(canManageSettings("moderator"), false);
  assert.equal(canManageSettings("admin"), true);
  assert.equal(canManageRoles("admin"), true);
  assert.equal(
    canChangeRole({
      actorId: "same",
      actorRole: "admin",
      targetId: "same",
      nextRole: "admin",
      currentTargetRole: "user",
      adminCount: 2,
    }),
    false,
  );
  assert.equal(
    canChangeRole({
      actorId: "admin-1",
      actorRole: "admin",
      targetId: "admin-2",
      nextRole: "user",
      currentTargetRole: "admin",
      adminCount: 1,
    }),
    false,
  );
  assert.equal(
    canChangeRole({
      actorId: "admin-1",
      actorRole: "admin",
      targetId: "user-1",
      nextRole: "moderator",
      currentTargetRole: "user",
      adminCount: 1,
    }),
    true,
  );
});

test("bloqueios vencidos são reativáveis, permanentes e banimentos não", () => {
  const now = new Date("2026-07-14T12:00:00.000Z");
  assert.deepEqual(
    resolveProfileState(
      {
        status: "blocked",
        blockType: "temporary",
        blockedUntil: "2026-07-14T11:59:00.000Z",
      },
      now,
    ),
    { allowed: true, shouldActivate: true },
  );
  assert.equal(
    resolveProfileState(
      {
        status: "blocked",
        blockType: "temporary",
        blockedUntil: "2026-07-14T13:00:00.000Z",
      },
      now,
    ).allowed,
    false,
  );
  assert.equal(
    resolveProfileState(
      { status: "blocked", blockType: "permanent", blockedUntil: null },
      now,
    ).allowed,
    false,
  );
  assert.equal(
    resolveProfileState(
      { status: "banned", blockType: "permanent", blockedUntil: null },
      now,
    ).allowed,
    false,
  );
});

test("denúncia exige alvo, tipo e motivo válidos", () => {
  assert.equal(
    validateReportInput({
      targetType: "topic",
      targetId: "t1",
      reason: "Motivo detalhado",
    }).errors.length,
    0,
  );
  assert.ok(
    validateReportInput({ targetType: "other", targetId: "", reason: "curto" })
      .errors.length >= 3,
  );
});

test("rate limit atômico não ultrapassa a política sob concorrência", async () => {
  const db = new AtomicRateLimitDb();
  const attempts = await Promise.all(
    Array.from({ length: 12 }, () =>
      consumeRateLimit("private@example.com", "topic", {
        db,
        salt: "test-only-long-salt",
        now: new Date("2026-07-14T12:00:00.000Z"),
      }),
    ),
  );
  assert.equal(
    attempts.filter((item) => item.allowed).length,
    RATE_LIMITS.topic.max,
  );
  assert.equal(attempts.filter((item) => !item.allowed).length, 7);
  assert.equal([...db.keys][0].includes("private@example.com"), false);
});

test("rate limit falha fechado quando o banco está indisponível", async () => {
  const unavailable: D1DatabaseLike = {
    prepare() {
      throw new Error("offline");
    },
  };
  assert.deepEqual(
    await consumeRateLimit("id", "report", { db: unavailable, salt: "salt" }),
    { allowed: false, reason: "unavailable" },
  );
});

class AtomicRateLimitDb implements D1DatabaseLike {
  counts = new Map<string, number>();
  keys = new Set<string>();

  prepare(query: string): D1PreparedLike {
    let values: unknown[] = [];
    return {
      bind(...input: unknown[]) {
        values = input;
        return this;
      },
      async run() {
        return {};
      },
      first: async <T>() => {
        if (!query.includes("INSERT INTO rate_limits")) return null;
        const key = String(values[0]);
        const max = Number(values.at(-1));
        const current = this.counts.get(key) || 0;
        if (current >= max) return null;
        this.counts.set(key, current + 1);
        this.keys.add(key);
        return { count: current + 1 } as T;
      },
    };
  }
}
