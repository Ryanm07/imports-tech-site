export const WALL_LIMITS = {
  name: { min: 2, max: 30 },
  title: { min: 8, max: 120 },
  topic: { min: 15, max: 4_000, maxLinks: 2 },
  reply: { min: 2, max: 2_000, maxLinks: 1 },
  report: { min: 10, max: 500 },
} as const;

export type WallPublicationStatus =
  | "pending"
  | "published"
  | "hidden"
  | "removed"
  | "spam";

export type WallRisk = "normal" | "suspicious" | "spam";

export type WallCategory = {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "archived";
};

export type PublicWallAuthor = {
  displayName: string;
  isOfficial: boolean;
  label: "Perfil oficial" | "Nome informado pelo visitante";
};

export type PublicWallTopic = {
  id: string;
  category: WallCategory;
  title: string;
  body: string;
  author: PublicWallAuthor;
  replyCount: number;
  isClosed: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PublicWallReply = {
  id: string;
  topicId: string;
  body: string;
  author: PublicWallAuthor;
  createdAt: string;
  updatedAt: string;
};

type ValidationResult<T> =
  | { ok: true; value: T; risk: WallRisk; riskReasons: string[] }
  | { ok: false; errors: string[] };

export type WallTopicInput = {
  displayName: string;
  categoryId: string;
  title: string;
  body: string;
};

export type WallReplyInput = {
  displayName: string;
  body: string;
};

const RESERVED_NAME_KEYS = new Set([
  "admin",
  "administrador",
  "administracao",
  "canalimportstech",
  "dono",
  "equipe",
  "equipeimportstech",
  "importstech",
  "importstechoficial",
  "moderador",
  "oficial",
  "owner",
  "ryan",
  "ryanimportstech",
  "staff",
  "suporte",
  "suporteimportstech",
]);

const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s]+/giu;
const HTML_PATTERN = /<\/?[a-z][^>]*>/iu;
const DANGEROUS_MARKUP_PATTERN =
  /(?:javascript\s*:|data\s*:\s*text\/html|vbscript\s*:|<\s*(?:script|iframe|object|embed|svg|math))/iu;
const SPAM_PATTERN =
  /(?:ganhe\s+dinheiro\s+(?:r[aá]pido|agora)|renda\s+garantida|clique\s+aqui\s+urgente|viagra|cassino\s+online|crypto\s+giveaway|suporte\s+via\s+whatsapp)/iu;
const SHORTENER_PATTERN =
  /(?:bit\.ly|tinyurl\.com|t\.co|cutt\.ly|rebrand\.ly|wa\.me)\//iu;

export function normalizeWallText(value: unknown, singleLine = false) {
  if (typeof value !== "string") return "";
  const normalized = value
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\r\n?/g, "\n");
  return (singleLine ? normalized.replace(/\s+/g, " ") : normalized)
    .trim()
    .replace(/\n{4,}/g, "\n\n\n");
}

export function reservedNameKey(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]/g, "");
}

export function isReservedDisplayName(value: string) {
  const key = reservedNameKey(value);
  if (!key) return false;
  if (RESERVED_NAME_KEYS.has(key)) return true;
  return (
    key.startsWith("importstech") ||
    key.endsWith("importstechoficial") ||
    /^(?:admin|moderador|suporte|staff|owner|dono)(?:importstech)?\d*$/u.test(
      key,
    )
  );
}

export function countWallLinks(value: string) {
  return value.match(URL_PATTERN)?.length ?? 0;
}

export function validateWallTopic(
  input: Record<string, unknown>,
): ValidationResult<WallTopicInput> {
  const rawName =
    typeof input.displayName === "string" ? input.displayName : "";
  const rawTitle = typeof input.title === "string" ? input.title : "";
  const rawBody = typeof input.body === "string" ? input.body : "";
  const displayName = normalizeWallText(rawName, true);
  const categoryId = normalizeWallText(input.categoryId, true);
  const title = normalizeWallText(rawTitle, true);
  const body = normalizeWallText(rawBody);
  const errors = validateName(displayName, rawName);

  if (!categoryId || categoryId.length > 80) {
    errors.push("Escolha uma categoria válida.");
  }
  if (title.length < WALL_LIMITS.title.min) {
    errors.push("O título precisa ter pelo menos 8 caracteres.");
  }
  if (
    title.length > WALL_LIMITS.title.max ||
    rawTitle.length > WALL_LIMITS.title.max
  ) {
    errors.push("O título pode ter no máximo 120 caracteres.");
  }
  if (body.length < WALL_LIMITS.topic.min) {
    errors.push("A mensagem precisa ter pelo menos 15 caracteres.");
  }
  if (
    body.length > WALL_LIMITS.topic.max ||
    rawBody.length > WALL_LIMITS.topic.max
  ) {
    errors.push("A mensagem pode ter no máximo 4.000 caracteres.");
  }
  if (countWallLinks(`${title}\n${body}`) > WALL_LIMITS.topic.maxLinks) {
    errors.push("Use no máximo dois links por publicação.");
  }
  if (errors.length) return { ok: false, errors };

  const risk = classifyRisk(`${rawTitle}\n${rawBody}`, `${title}\n${body}`);
  return { ok: true, value: { displayName, categoryId, title, body }, ...risk };
}

export function validateWallReply(
  input: Record<string, unknown>,
): ValidationResult<WallReplyInput> {
  const rawName =
    typeof input.displayName === "string" ? input.displayName : "";
  const rawBody = typeof input.body === "string" ? input.body : "";
  const displayName = normalizeWallText(rawName, true);
  const body = normalizeWallText(rawBody);
  const errors = validateName(displayName, rawName);

  if (body.length < WALL_LIMITS.reply.min) {
    errors.push("A resposta precisa ter pelo menos 2 caracteres.");
  }
  if (
    body.length > WALL_LIMITS.reply.max ||
    rawBody.length > WALL_LIMITS.reply.max
  ) {
    errors.push("A resposta pode ter no máximo 2.000 caracteres.");
  }
  if (countWallLinks(body) > WALL_LIMITS.reply.maxLinks) {
    errors.push("Use no máximo um link por resposta.");
  }
  if (errors.length) return { ok: false, errors };

  const risk = classifyRisk(rawBody, body);
  return { ok: true, value: { displayName, body }, ...risk };
}

export function validateWallReport(input: Record<string, unknown>) {
  const targetType =
    input.targetType === "topic" || input.targetType === "reply"
      ? input.targetType
      : null;
  const targetId = normalizeWallText(input.targetId, true);
  const rawReason = typeof input.reason === "string" ? input.reason : "";
  const reason = normalizeWallText(rawReason);
  const errors: string[] = [];
  if (!targetType) errors.push("Tipo de conteúdo inválido.");
  if (!targetId || targetId.length > 80) errors.push("Conteúdo inválido.");
  if (reason.length < WALL_LIMITS.report.min) {
    errors.push("O motivo precisa ter pelo menos 10 caracteres.");
  }
  if (
    reason.length > WALL_LIMITS.report.max ||
    rawReason.length > WALL_LIMITS.report.max
  ) {
    errors.push("O motivo pode ter no máximo 500 caracteres.");
  }
  return { targetType, targetId, reason, errors };
}

export function statusForRisk(risk: WallRisk): WallPublicationStatus {
  if (risk === "spam") return "spam";
  if (risk === "suspicious") return "pending";
  return "published";
}

export async function wallContentHash(...parts: string[]) {
  const bytes = new TextEncoder().encode(
    parts
      .map((part) => normalizeWallText(part).toLocaleLowerCase("pt-BR"))
      .join("\u001f"),
  );
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return bytesToHex(digest);
}

export function publicWallAuthor(
  displayName: string,
  isOfficial: boolean,
): PublicWallAuthor {
  return {
    displayName,
    isOfficial,
    label: isOfficial ? "Perfil oficial" : "Nome informado pelo visitante",
  };
}

export function toPublicWallTopic(row: {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryDescription: string | null;
  categoryStatus: "active" | "archived";
  displayName: string;
  title: string;
  body: string;
  isOfficial: boolean | number;
  replyCount: number;
  closedAt: string | null;
  pinnedAt: string | null;
  createdAt: string;
  updatedAt: string;
}): PublicWallTopic {
  return {
    id: row.id,
    category: {
      id: row.categoryId,
      name: row.categoryName,
      description: row.categoryDescription,
      status: row.categoryStatus,
    },
    title: row.title,
    body: row.body,
    author: publicWallAuthor(row.displayName, Boolean(row.isOfficial)),
    replyCount: row.replyCount,
    isClosed: Boolean(row.closedAt),
    isPinned: Boolean(row.pinnedAt),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toPublicWallReply(row: {
  id: string;
  topicId: string;
  displayName: string;
  body: string;
  isOfficial: boolean | number;
  createdAt: string;
  updatedAt: string;
}): PublicWallReply {
  return {
    id: row.id,
    topicId: row.topicId,
    body: row.body,
    author: publicWallAuthor(row.displayName, Boolean(row.isOfficial)),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function validateName(displayName: string, rawName: string) {
  const errors: string[] = [];
  if (displayName.length < WALL_LIMITS.name.min) {
    errors.push("Informe um nome com pelo menos 2 caracteres.");
  }
  if (
    displayName.length > WALL_LIMITS.name.max ||
    rawName.length > WALL_LIMITS.name.max
  ) {
    errors.push("O nome pode ter no máximo 30 caracteres.");
  }
  if (isReservedDisplayName(displayName)) {
    errors.push("Esse nome é reservado ao canal. Escolha outro nome.");
  }
  if (/[@]|https?:\/\/|www\./iu.test(displayName)) {
    errors.push("Não use e-mail, arroba ou link no nome.");
  }
  return errors;
}

function classifyRisk(
  raw: string,
  clean: string,
): { risk: WallRisk; riskReasons: string[] } {
  const riskReasons: string[] = [];
  if (DANGEROUS_MARKUP_PATTERN.test(raw) || SPAM_PATTERN.test(clean)) {
    return {
      risk: "spam",
      riskReasons: ["conteúdo malicioso ou spam conhecido"],
    };
  }
  if (HTML_PATTERN.test(raw) || raw.normalize("NFKC") !== clean) {
    riskReasons.push("marcação ou caracteres invisíveis removidos");
  }
  if (SHORTENER_PATTERN.test(clean)) riskReasons.push("link encurtado");
  if (/(.)\1{7,}/iu.test(clean))
    riskReasons.push("caracteres excessivamente repetidos");
  if (hasRepeatedPhrase(clean)) riskReasons.push("conteúdo repetitivo");
  const letters = clean.match(/\p{L}/gu) ?? [];
  const upper = clean.match(/\p{Lu}/gu) ?? [];
  if (letters.length >= 25 && upper.length / letters.length > 0.82) {
    riskReasons.push("uso excessivo de maiúsculas");
  }
  return { risk: riskReasons.length ? "suspicious" : "normal", riskReasons };
}

function hasRepeatedPhrase(value: string) {
  const words = value
    .toLocaleLowerCase("pt-BR")
    .split(/\s+/u)
    .filter((word) => word.length >= 3);
  for (let index = 0; index <= words.length - 4; index += 1) {
    if (
      words[index] === words[index + 1] &&
      words[index] === words[index + 2] &&
      words[index] === words[index + 3]
    ) {
      return true;
    }
  }
  return false;
}

function bytesToHex(value: ArrayBuffer) {
  return Array.from(new Uint8Array(value), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
