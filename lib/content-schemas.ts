import {
  categories,
  type Category,
  type Find,
  type Review,
} from "@/lib/site-data";
import { sanitizePlainText } from "@/lib/security";

export type ContentType = "review" | "find" | "video" | "category" | "setting";

const PATCH_FIELDS = [
  "title",
  "slug",
  "payload",
  "featured",
  "status",
] as const;

export function explicitContentPatch(input: Record<string, unknown>) {
  const result: Partial<Record<(typeof PATCH_FIELDS)[number], unknown>> = {};
  for (const field of PATCH_FIELDS) {
    if (Object.hasOwn(input, field)) result[field] = input[field];
  }
  return result;
}

export function sanitizeSlug(value: unknown) {
  return sanitizePlainText(value, 100)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function validateContentPayload(type: ContentType, value: unknown) {
  if (!isRecord(value)) return invalid("Payload precisa ser um objeto.");
  const rawSize = new TextEncoder().encode(JSON.stringify(value)).byteLength;
  if (rawSize > 20_000) return invalid("Payload excede o limite de 20 KB.");

  if (type === "review") return validateReview(value);
  if (type === "find") return validateFind(value);
  if (type === "category") return validateCategory(value);
  if (type === "video") return validateVideo(value);
  return validateSetting(value);
}

function validateReview(value: Record<string, unknown>) {
  const manufacturer = text(value.manufacturer, 80);
  const category = text(value.category, 60);
  const summary = text(value.summary, 600);
  const testedAt = date(value.testedAt);
  const videoId = videoIdValue(value.videoId);
  if (
    !manufacturer ||
    !category ||
    summary.length < 20 ||
    !testedAt ||
    !videoId
  ) {
    return invalid(
      "Review exige fabricante, categoria, resumo, data e vídeo válidos.",
    );
  }
  const payload: Omit<Review, "slug" | "name"> = {
    manufacturer,
    category,
    summary,
    testedAt,
    pricePaid: nullableMoney(value.pricePaid),
    marketPrice: nullableMoney(value.marketPrice),
    repairCost: nullableMoney(value.repairCost),
    totalCost: nullableMoney(value.totalCost),
    verdict:
      value.verdict === "Vale a pena" ||
      value.verdict === "Depende do preço" ||
      value.verdict === "Não recomendo"
        ? value.verdict
        : null,
    positives: textList(value.positives, 8, 160),
    negatives: textList(value.negatives, 8, 160),
    scores: null,
    status: text(value.status, 300),
    facts: textList(value.facts, 12, 200),
    updatedAt: date(value.updatedAt) || new Date().toISOString().slice(0, 10),
    videoId,
  };
  return valid(payload);
}

function validateFind(value: Record<string, unknown>) {
  const product = text(value.product, 160);
  const announcedProblem = text(value.announcedProblem, 600);
  const result = text(value.result, 300);
  const currentStatus = text(value.currentStatus, 160);
  const videoId = videoIdValue(value.videoId);
  const negotiatedPrice = requiredMoney(value.negotiatedPrice);
  if (
    !product ||
    !announcedProblem ||
    !result ||
    !currentStatus ||
    !videoId ||
    negotiatedPrice === null
  ) {
    return invalid(
      "Garimpo exige produto, preço, contexto, resultado, status e vídeo.",
    );
  }
  const timeline = Array.isArray(value.timeline)
    ? value.timeline.slice(0, 12).flatMap((item) => {
        if (!isRecord(item)) return [];
        const label = text(item.label, 100);
        const detail = text(item.detail, 400);
        if (!label || !detail) return [];
        return [
          {
            label,
            detail,
            state: item.state === "pending" ? "pending" : "done",
          } as const,
        ];
      })
    : [];
  const payload: Omit<Find, "slug"> = {
    product,
    announcedPrice: nullableMoney(value.announcedPrice),
    negotiatedPrice,
    announcedProblem,
    repairCost: nullableMoney(value.repairCost),
    totalCost: nullableMoney(value.totalCost),
    salePrice: nullableMoney(value.salePrice),
    reimbursement: nullableMoney(value.reimbursement),
    result,
    currentStatus,
    videoId,
    tags: textList(value.tags, 12, 60),
    updatedAt: date(value.updatedAt) || new Date().toISOString().slice(0, 10),
    timeline,
  };
  return valid(payload);
}

function validateCategory(value: Record<string, unknown>) {
  const name = text(value.name, 60);
  const description = text(value.description, 240);
  const icon = text(value.icon, 8);
  if (!name || !description || !icon) {
    return invalid("Categoria exige nome, descrição e índice visual.");
  }
  const payload: Category = {
    name,
    description,
    icon,
    relation: text(value.relation, 120) || undefined,
  };
  return valid(payload);
}

function validateVideo(value: Record<string, unknown>) {
  const id = videoIdValue(value.id);
  const title = text(value.title, 200);
  const category = text(value.category, 60);
  if (!id || !title || !category) {
    return invalid("Vídeo exige ID, título e categoria.");
  }
  return valid({
    id,
    title,
    category,
    tags: textList(value.tags, 12, 60),
    summary: text(value.summary, 1000),
  });
}

function validateSetting(value: Record<string, unknown>) {
  const key = text(value.key, 80);
  const settingValue = text(value.value, 2000);
  if (!key || !settingValue)
    return invalid("Configuração exige chave e valor.");
  return valid({ key, value: settingValue });
}

function text(value: unknown, max: number) {
  return sanitizePlainText(value, max);
}

function textList(value: unknown, maxItems: number, maxLength: number) {
  return Array.isArray(value)
    ? value
        .slice(0, maxItems)
        .map((item) => text(item, maxLength))
        .filter(Boolean)
    : [];
}

function nullableMoney(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  return requiredMoney(value);
}

function requiredMoney(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 10_000_000
    ? Math.round(parsed * 100) / 100
    : null;
}

function date(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(value)) return "";
  return Number.isNaN(new Date(value).getTime()) ? "" : value;
}

function videoIdValue(value: unknown) {
  return typeof value === "string" && /^[\w-]{11}$/.test(value) ? value : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function valid<T>(payload: T) {
  return { ok: true as const, payload, errors: [] as string[] };
}

function invalid(error: string) {
  return { ok: false as const, payload: null, errors: [error] };
}

export const defaultCategories = categories;
