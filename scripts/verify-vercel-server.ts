import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const cwd = fileURLToPath(new URL("../", import.meta.url));
const port = 4301;
const origin = `http://127.0.0.1:${port}`;
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    cwd,
    env: {
      ...process.env,
      ADMIN_ENABLED: "true",
      EDITORIAL_DB_ENABLED: "true",
      OWNER_EMAILS: "deployment-check@example.invalid",
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  },
);
let serverOutput = "";
server.stdout?.on("data", (chunk: Buffer) => {
  serverOutput += chunk.toString();
});
server.stderr?.on("data", (chunk: Buffer) => {
  serverOutput += chunk.toString();
});

try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null)
      throw new Error(`Next server exited: ${serverOutput}`);
    try {
      const response = await fetch(origin, {
        signal: AbortSignal.timeout(1_000),
      });
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      /* Server is still starting. */
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert(ready, "Next production server must become ready");

  for (const path of ["/", "/sobre", "/contato", "/metricas", "/comunidade"]) {
    const response = await fetch(`${origin}${path}`);
    assert.equal(
      response.status,
      200,
      `${path} must render without Cloudflare bindings`,
    );
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert(
      response.headers
        .get("content-security-policy")
        ?.includes("object-src 'none'"),
    );
    const html = await response.text();
    if (path === "/") assert(html.includes("Entre. Fique"));
    if (path === "/contato")
      assert(html.includes("mailto:imports.tech.contact@gmail.com"));
  }

  for (const path of ["/api/admin/content", "/api/admin/youtube"]) {
    for (const method of ["GET", "POST"]) {
      const response = await fetch(`${origin}${path}`, {
        method,
        headers: {
          "oai-authenticated-user-email": "deployment-check@example.invalid",
          origin,
          "content-type": "application/json",
        },
        ...(method === "POST" ? { body: "{}" } : {}),
      });
      assert.equal(
        response.status,
        503,
        `${method} ${path} must remain closed without a trusted backend`,
      );
      assert(response.headers.get("cache-control")?.includes("no-store"));
    }
  }
  const metrics = (await (await fetch(`${origin}/api/youtube`)).json()) as {
    source: string;
    stale: boolean;
    updatedAt: string | null;
  };
  assert.equal(metrics.source, "snapshot");
  assert.equal(metrics.stale, true);
  assert(metrics.updatedAt, "Historical metrics must disclose their date");
  console.log(
    "Next/Vercel verificado: 5 páginas, headers, contato, métricas históricas e 4 tentativas de acesso privado recusadas.",
  );
} finally {
  const stopped = new Promise<void>((resolve) =>
    server.once("close", () => resolve()),
  );
  server.kill();
  await stopped;
}
