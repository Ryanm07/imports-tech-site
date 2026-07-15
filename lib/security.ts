import { getAllowedOrigins } from "@/lib/site-url";

export function sanitizePlainText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, maxLength);
}

type OriginOptions = {
  siteUrl?: string;
  allowedOrigins?: string;
  isProduction?: boolean;
};

export function sameOriginRequest(
  request: Request,
  options: OriginOptions = {},
) {
  const requestOrigin = safeOrigin(request.url);
  if (!requestOrigin) return false;

  const allowed = getAllowedOrigins(options.siteUrl, options.allowedOrigins);
  const isProduction =
    options.isProduction ?? process.env.NODE_ENV === "production";
  if (!isProduction) allowed.add(requestOrigin);

  const originHeader = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();

  if (originHeader === "null") return false;
  if (!originHeader) {
    return fetchSite === "same-origin" && allowed.has(requestOrigin);
  }

  const origin = safeOrigin(originHeader);
  if (!origin || !allowed.has(origin)) return false;
  if (fetchSite && !["same-origin", "none"].includes(fetchSite)) return false;
  return requestOrigin === origin;
}

function safeOrigin(value: string) {
  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}
