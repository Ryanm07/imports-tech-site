import assert from "node:assert/strict";
import test from "node:test";
import { consumeRateLimit, RATE_LIMITS } from "../lib/rate-limit";
import { sameOriginRequest } from "../lib/security";
import type { D1DatabaseLike, D1PreparedLike } from "../lib/rate-limit";

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

test("rate limit atômico não ultrapassa a política sob concorrência", async () => {
  const db = new AtomicRateLimitDb();
  const attempts = await Promise.all(
    Array.from({ length: RATE_LIMITS.admin.max + 5 }, () =>
      consumeRateLimit("private@example.com", "admin", {
        db,
        salt: "test-only-long-salt",
        now: new Date("2026-07-14T12:00:00.000Z"),
      }),
    ),
  );
  assert.equal(
    attempts.filter((item) => item.allowed).length,
    RATE_LIMITS.admin.max,
  );
  assert.equal(
    attempts.filter((item) => !item.allowed).length,
    attempts.length - RATE_LIMITS.admin.max,
  );
  assert.equal([...db.keys][0].includes("private@example.com"), false);
});

test("rate limit falha fechado quando o banco está indisponível", async () => {
  const unavailable: D1DatabaseLike = {
    prepare() {
      throw new Error("offline");
    },
  };
  assert.deepEqual(
    await consumeRateLimit("id", "youtubeSync", {
      db: unavailable,
      salt: "salt",
    }),
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
