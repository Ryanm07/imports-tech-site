const PRODUCTION_URL = "https://central-do-canal-2026.vsvsbssy.chatgpt.site";

export function getSiteUrl(
  value = process.env.SITE_URL,
  productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL,
) {
  const fallback = validProductionHost(productionHost)
    ? `https://${productionHost}`
    : PRODUCTION_URL;
  const candidate = value || fallback;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return new URL(fallback);
  }

  const isLocalHttp =
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(url.hostname);
  if (url.protocol !== "https:" && !isLocalHttp) return new URL(fallback);
  if (url.username || url.password || url.search || url.hash) {
    return new URL(fallback);
  }
  url.pathname = "/";
  return url;
}

function validProductionHost(host: string | undefined): host is string {
  if (!host || host.length > 253 || !host.includes(".")) return false;
  return host
    .split(".")
    .every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/iu.test(label));
}

export function getAllowedOrigins(
  siteUrl = process.env.SITE_URL,
  extraOrigins = process.env.ALLOWED_ORIGINS,
) {
  const origins = new Set([getSiteUrl(siteUrl).origin]);
  for (const candidate of (extraOrigins || "").split(",")) {
    const value = candidate.trim();
    if (!value) continue;
    try {
      const url = new URL(value);
      if (url.protocol === "https:" || url.hostname === "localhost") {
        origins.add(url.origin);
      }
    } catch {
      // Invalid configured origins are ignored instead of weakening validation.
    }
  }
  return origins;
}
