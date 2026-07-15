import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { containsPublicYouTubeSecret } from "../lib/public-bundle-security";

const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".map",
  ".mjs",
  ".txt",
]);
const clientRoot = new URL("../dist/client/", import.meta.url);
const files = await walk(fileURLToPath(clientRoot));
const configuredSecret = process.env.YOUTUBE_API_KEY || "";

for (const file of files) {
  if (!textExtensions.has(extname(file).toLowerCase())) continue;
  const source = await readFile(file, "utf8");
  if (containsPublicYouTubeSecret(source, configuredSecret)) {
    throw new Error("O bundle público contém um padrão de Secret do YouTube.");
  }
}

console.log(
  `Bundle público verificado: ${files.length} arquivos sem Secret do YouTube.`,
);

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? walk(path) : Promise.resolve([path]);
    }),
  );
  return nested.flat();
}
