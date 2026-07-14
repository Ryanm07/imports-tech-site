const PRODUCTION_URL = "https://central-do-canal-2026.vsvsbssy.chatgpt.site";

export function getSiteUrl(value = process.env.SITE_URL) {
  const candidate = value || PRODUCTION_URL;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return new URL(PRODUCTION_URL);
  }

  const isLocalHttp =
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(url.hostname);
  if (url.protocol !== "https:" && !isLocalHttp) return new URL(PRODUCTION_URL);
  if (url.username || url.password || url.search || url.hash) {
    return new URL(PRODUCTION_URL);
  }
  url.pathname = "/";
  return url;
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
