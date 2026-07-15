import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";
import {
  INTRO_FINAL_FRAME_SECONDS,
  INTRO_SESSION_KEY,
  mapIntroGeometry,
} from "../lib/intro";
import { containsPublicYouTubeSecret } from "../lib/public-bundle-security";

const root = new URL("../", import.meta.url);

test("intro v3 usa geometria cover exata no desktop e no celular", () => {
  assert.equal(INTRO_SESSION_KEY, "imports-tech:intro:v3");
  assert.equal(INTRO_FINAL_FRAME_SECONDS, 4.83);

  const desktop = mapIntroGeometry(1440, 900);
  assert.equal(desktop.scale, 1.25);
  assert.equal(desktop.offsetX, -80);
  assert.equal(desktop.offsetY, 0);
  assert.deepEqual(desktop.logo, {
    left: 505,
    top: 328.75,
    width: 430,
    height: 241.25,
  });

  const mobile = mapIntroGeometry(375, 667);
  assert.ok(mobile.renderedWidth > 375);
  assert.equal(mobile.renderedHeight, 667);
  assert.ok(mobile.logo.left < 375 && mobile.logo.left + mobile.logo.width > 0);
});

test("os quatro assets definitivos da intro estão versionados e válidos", async () => {
  const base = new URL("../public/intro/", import.meta.url);
  const [mp4, webm, poster, finalFrame] = await Promise.all([
    readFile(new URL("imports-tech-intro.mp4", base)),
    readFile(new URL("imports-tech-intro.webm", base)),
    readFile(new URL("imports-tech-intro-poster.webp", base)),
    readFile(new URL("imports-tech-intro-final.webp", base)),
  ]);
  assert.equal(mp4.subarray(4, 8).toString("ascii"), "ftyp");
  assert.deepEqual([...webm.subarray(0, 4)], [0x1a, 0x45, 0xdf, 0xa3]);
  for (const webp of [poster, finalFrame]) {
    assert.equal(webp.subarray(0, 4).toString("ascii"), "RIFF");
    assert.equal(webp.subarray(8, 12).toString("ascii"), "WEBP");
  }
  const duration = mp4Duration(mp4);
  assert.ok(duration >= 4.8 && duration <= 5.05, `duração MP4: ${duration}`);
  assert.ok(
    (await stat(new URL("imports-tech-intro.webm", base))).size > 500_000,
  );
});

test("navegação pública é curta e rotas antigas têm redirect seguro", async () => {
  const [header, videos, videoDetail, reviews, finds, community] =
    await Promise.all([
      source("components/site-header.tsx"),
      source("app/videos/page.tsx"),
      source("app/videos/[id]/page.tsx"),
      source("app/reviews/page.tsx"),
      source("app/garimpos/page.tsx"),
      source("app/comunidade/page.tsx"),
    ]);
  for (const label of ["Início", "Minha história", "Comunidade"]) {
    assert.equal(header.includes(label), true, label);
  }
  assert.match(header, /projectsEnabled/);
  assert.equal(header.includes("Ctrl"), false);
  assert.equal(header.includes("Pesquisar"), false);
  assert.match(videos, /redirect\(BRAND_LINKS\.youtube\)/);
  assert.match(reviews, /redirect\("\/sobre"\)/);
  assert.match(finds, /redirect\("\/sobre"\)/);
  assert.match(videoDetail, /BRAND_LINKS\.youtubeWatch/);
  assert.match(videoDetail, /\^\[A-Za-z0-9_-\]\{11\}\$/);
  assert.equal(community.includes("TelegramSection"), true);
  assert.equal(community.includes("CommunityClient"), false);
  assert.equal(community.includes("fórum próprio"), true);
});

test("serviço do YouTube não contém implementação de catálogo", async () => {
  const service = await source("lib/youtube-service.ts");
  assert.equal(service.includes("playlistItems"), false);
  assert.equal(service.includes("youtube/v3/videos"), false);
  assert.equal(service.includes("nextPageToken"), false);
});

test("intro possui caminhos de teclado, falha, timeout, alvo real e autoplay seguro", async () => {
  const [intro, header, home] = await Promise.all([
    source("components/site-intro.tsx"),
    source("components/site-header.tsx"),
    source("app/home-page.tsx"),
  ]);
  for (const contract of [
    "Pular intro",
    'event.key === "Escape"',
    "onError",
    "onEnded",
    "8_000",
    "requestVideoFrameCallback",
    "muted",
    "playsInline",
  ]) {
    assert.equal(intro.includes(contract), true, contract);
  }
  assert.equal(header.includes("data-intro-logo-target"), true);
  assert.equal(home.includes("data-intro-orbit-target"), true);
});

test("sincronização manual é privada e a chave não possui caminho cliente", async () => {
  const [adminRoute, service, exampleEnv] = await Promise.all([
    source("app/api/admin/youtube/route.ts"),
    source("lib/youtube-service.ts"),
    source(".env.example"),
  ]);
  assert.equal(adminRoute.includes("requireOwnerApi"), true);
  assert.equal(adminRoute.includes("sameOriginRequest"), true);
  assert.equal(adminRoute.includes('trigger: "manual"'), true);
  assert.equal(adminRoute.includes("process.env.YOUTUBE_API_KEY"), true);
  assert.equal(adminRoute.includes("apiConfigured"), true);
  assert.equal(adminRoute.includes("apiKey:"), false);
  assert.equal(adminRoute.includes("errorMessage: run.errorMessage"), false);
  assert.equal(service.includes("NEXT_PUBLIC_YOUTUBE"), false);
  assert.equal(exampleEnv.includes("NEXT_PUBLIC_YOUTUBE"), false);
  assert.equal(containsPublicYouTubeSecret("const value = 'público'"), false);
  assert.equal(
    containsPublicYouTubeSecret(
      "const key = 'AIzaabcdefghijklmnopqrstuvwxyz123456789'",
    ),
    true,
  );
  assert.equal(
    containsPublicYouTubeSecret(
      "conteúdo com segredo-de-teste",
      "segredo-de-teste",
    ),
    true,
  );
});

test("Mural e APIs públicas foram removidos da experiência ativa", async () => {
  for (const path of [
    "app/api/community/topics/route.ts",
    "app/api/community/reports/route.ts",
    "components/community-client.tsx",
    "lib/wall-request.ts",
  ]) {
    await assert.rejects(access(new URL(path, root)));
  }
  const redirect = await source("app/comunidade/[id]/page.tsx");
  assert.match(redirect, /permanentRedirect\("\/comunidade"\)/);
});

test("Telegram contém as duas entradas editoriais e fallback sem link", async () => {
  const telegram = await source("components/telegram-section.tsx");
  assert.equal(telegram.includes("Canal de promoções"), true);
  assert.equal(telegram.includes("promoções, cupons e oportunidades"), true);
  assert.equal(telegram.includes("Grupo da comunidade"), true);
  assert.equal(telegram.includes("Em breve"), true);
});

async function source(path: string) {
  return readFile(new URL(path, root), "utf8");
}

function mp4Duration(buffer: Buffer) {
  const marker = buffer.indexOf(Buffer.from("mvhd"));
  assert.ok(marker > 0, "atom mvhd ausente");
  const version = buffer[marker + 4];
  if (version === 1) {
    const timescale = buffer.readUInt32BE(marker + 24);
    const duration = Number(buffer.readBigUInt64BE(marker + 28));
    return duration / timescale;
  }
  const timescale = buffer.readUInt32BE(marker + 16);
  const duration = buffer.readUInt32BE(marker + 20);
  return duration / timescale;
}
