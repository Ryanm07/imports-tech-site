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

export function countLinks(value: string) {
  return (value.match(/https?:\/\//gi) || []).length;
}

export function validateCommunityPost(titleValue: unknown, bodyValue: unknown) {
  const title = sanitizePlainText(titleValue, 120);
  const body = sanitizePlainText(bodyValue, 4000);
  const errors: string[] = [];
  if (title.length < 8)
    errors.push("O título precisa ter pelo menos 8 caracteres.");
  if (body.length < 20) {
    errors.push("Conte um pouco mais para a comunidade conseguir ajudar.");
  }
  if (countLinks(body) > 2) {
    errors.push("Use no máximo dois links por publicação.");
  }
  return { title, body, errors };
}

export function validateReportInput(input: Record<string, unknown>): {
  targetType: "topic" | "reply" | null;
  targetId: string;
  reason: string;
  errors: string[];
} {
  const targetType: "topic" | "reply" | null =
    input.targetType === "topic" || input.targetType === "reply"
      ? input.targetType
      : null;
  const targetId = sanitizePlainText(input.targetId, 80);
  const reason = sanitizePlainText(input.reason, 500);
  const errors: string[] = [];
  if (!targetType) errors.push("Tipo de alvo inválido.");
  if (!targetId) errors.push("Alvo obrigatório.");
  if (reason.length < 10)
    errors.push("O motivo precisa ter pelo menos 10 caracteres.");
  return { targetType, targetId, reason, errors };
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
