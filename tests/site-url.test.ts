import assert from "node:assert/strict";
import test from "node:test";
import { getSiteUrl } from "../lib/site-url";

test("Vercel usa o domínio de produção quando SITE_URL está ausente", () => {
  assert.equal(
    getSiteUrl("", "imports-tech-studio.vercel.app").href,
    "https://imports-tech-studio.vercel.app/",
  );
  assert.equal(
    getSiteUrl(
      "https://imports-tech.example/historia",
      "imports-tech-studio.vercel.app",
    ).href,
    "https://imports-tech.example/",
  );
});

test("fallback Vercel rejeita credenciais, caminhos, portas e protocolos", () => {
  for (const host of [
    "user@example.com",
    "example.com/path",
    "example.com?x=1",
    "example.com:443",
    "https://example.com",
    "localhost",
    "evil\\example.com",
  ]) {
    assert.equal(
      getSiteUrl("", host).hostname,
      "central-do-canal-2026.vsvsbssy.chatgpt.site",
    );
  }
  assert.equal(
    getSiteUrl("javascript:alert(1)", "imports-tech-studio.vercel.app").href,
    "https://imports-tech-studio.vercel.app/",
  );
});
