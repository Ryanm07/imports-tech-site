import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { contentEntries, moderationActions } from "@/db/schema";
import {
  explicitContentPatch,
  sanitizeSlug,
  type ContentType,
  validateContentPayload,
} from "@/lib/content-schemas";
import { canManageSettings } from "@/lib/community-domain";
import { privateJson } from "@/lib/http";
import { consumeRateLimit } from "@/lib/rate-limit";
import { sameOriginRequest, sanitizePlainText } from "@/lib/security";
import { requireStaffApi } from "@/lib/server-auth";

const CONTENT_TYPES: ContentType[] = [
  "review",
  "find",
  "video",
  "category",
  "setting",
];
const CONTENT_STATUSES = ["draft", "published", "archived", "removed"] as const;

function disabled() {
  return process.env.ADMIN_ENABLED !== "true";
}

export async function GET(request: Request) {
  if (disabled())
    return privateJson({ error: "Painel desativado." }, { status: 503 });
  const auth = await requireStaffApi();
  if (auth.kind === "error") return auth.error;

  const page = positiveInteger(
    new URL(request.url).searchParams.get("page"),
    1,
  );
  const limit = 30;
  const entries = await getDb()
    .select()
    .from(contentEntries)
    .orderBy(desc(contentEntries.updatedAt))
    .limit(limit)
    .offset((page - 1) * limit);
  return privateJson({ entries, page, hasMore: entries.length === limit });
}

export async function POST(request: Request) {
  if (disabled())
    return privateJson({ error: "Painel desativado." }, { status: 503 });
  if (!sameOriginRequest(request)) {
    return privateJson({ error: "Origem inválida." }, { status: 403 });
  }
  const auth = await requireStaffApi();
  if (auth.kind === "error") return auth.error;
  const limited = await adminRateLimit(auth.user.email);
  if (limited) return limited;

  const input = await request.json().catch(() => ({}));
  const type = CONTENT_TYPES.includes(input.type) ? input.type : null;
  const title = sanitizePlainText(input.title, 160);
  const slug = sanitizeSlug(input.slug);
  if (!type || title.length < 3 || slug.length < 3) {
    return privateJson({ error: "Conteúdo inválido." }, { status: 400 });
  }
  if (type === "setting" && !canManageSettings(auth.profile.role)) {
    return privateJson(
      { error: "Apenas administradores gerenciam configurações." },
      { status: 403 },
    );
  }
  const validated = validateContentPayload(type, input.payload);
  if (!validated.ok) {
    return privateJson({ errors: validated.errors }, { status: 400 });
  }

  const now = new Date().toISOString();
  const entry: typeof contentEntries.$inferInsert = {
    id: crypto.randomUUID(),
    type,
    title,
    slug,
    payload: JSON.stringify(validated.payload),
    status: "draft",
    featured: false,
    createdById: auth.profile.id,
    updatedById: auth.profile.id,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    deletedAt: null,
  };
  const db = getDb();
  await db.insert(contentEntries).values(entry);
  await auditContent(auth.profile, "content.create", type, entry.id, { slug });
  return privateJson({ entry }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (disabled())
    return privateJson({ error: "Painel desativado." }, { status: 503 });
  if (!sameOriginRequest(request)) {
    return privateJson({ error: "Origem inválida." }, { status: 403 });
  }
  const auth = await requireStaffApi();
  if (auth.kind === "error") return auth.error;
  const limited = await adminRateLimit(auth.user.email);
  if (limited) return limited;

  const input = await request.json().catch(() => ({}));
  const patch = explicitContentPatch(input);
  const id = sanitizePlainText(input.id, 80);
  if (!id) return privateJson({ error: "ID obrigatório." }, { status: 400 });

  const db = getDb();
  const existing = await db
    .select()
    .from(contentEntries)
    .where(eq(contentEntries.id, id))
    .limit(1);
  if (!existing[0]) {
    return privateJson({ error: "Conteúdo não encontrado." }, { status: 404 });
  }
  if (existing[0].type === "setting" && !canManageSettings(auth.profile.role)) {
    return privateJson(
      { error: "Apenas administradores gerenciam configurações." },
      { status: 403 },
    );
  }

  const changes: Partial<typeof contentEntries.$inferInsert> = {
    updatedById: auth.profile.id,
    updatedAt: new Date().toISOString(),
  };
  if (Object.hasOwn(patch, "title")) {
    const title = sanitizePlainText(patch.title, 160);
    if (title.length < 3)
      return privateJson({ error: "Título inválido." }, { status: 400 });
    changes.title = title;
  }
  if (Object.hasOwn(patch, "slug")) {
    const slug = sanitizeSlug(patch.slug);
    if (slug.length < 3)
      return privateJson({ error: "Slug inválido." }, { status: 400 });
    changes.slug = slug;
  }
  if (Object.hasOwn(patch, "payload")) {
    const validated = validateContentPayload(existing[0].type, patch.payload);
    if (!validated.ok)
      return privateJson({ errors: validated.errors }, { status: 400 });
    changes.payload = JSON.stringify(validated.payload);
  }
  if (Object.hasOwn(patch, "featured")) {
    if (typeof patch.featured !== "boolean") {
      return privateJson({ error: "Destaque inválido." }, { status: 400 });
    }
    changes.featured = patch.featured;
  }
  if (Object.hasOwn(patch, "status")) {
    const status = patch.status;
    if (
      typeof status !== "string" ||
      !CONTENT_STATUSES.includes(status as (typeof CONTENT_STATUSES)[number])
    ) {
      return privateJson({ error: "Status inválido." }, { status: 400 });
    }
    const validStatus = status as (typeof CONTENT_STATUSES)[number];
    const payload = Object.hasOwn(patch, "payload")
      ? patch.payload
      : JSON.parse(existing[0].payload);
    const validated = validateContentPayload(existing[0].type, payload);
    if (validStatus === "published" && !validated.ok) {
      return privateJson({ errors: validated.errors }, { status: 400 });
    }
    changes.status = validStatus;
    changes.publishedAt =
      validStatus === "published"
        ? existing[0].publishedAt || new Date().toISOString()
        : existing[0].publishedAt;
    changes.deletedAt =
      validStatus === "removed" ? new Date().toISOString() : null;
  }

  const updated = await db
    .update(contentEntries)
    .set(changes)
    .where(eq(contentEntries.id, id))
    .returning();
  if (!updated.length) {
    return privateJson({ error: "Conteúdo não encontrado." }, { status: 404 });
  }
  await auditContent(auth.profile, "content.update", updated[0].type, id, {
    changedFields: Object.keys(changes).filter(
      (key) => key !== "updatedAt" && key !== "updatedById",
    ),
  });
  return privateJson({ entry: updated[0] });
}

export async function DELETE(request: Request) {
  if (disabled())
    return privateJson({ error: "Painel desativado." }, { status: 503 });
  if (!sameOriginRequest(request)) {
    return privateJson({ error: "Origem inválida." }, { status: 403 });
  }
  const auth = await requireStaffApi();
  if (auth.kind === "error") return auth.error;
  const input = await request.json().catch(() => ({}));
  const id = sanitizePlainText(input.id, 80);
  const reason = sanitizePlainText(input.reason, 500);
  if (!id || reason.length < 8) {
    return privateJson(
      { error: "ID e motivo são obrigatórios." },
      { status: 400 },
    );
  }
  const now = new Date().toISOString();
  const updated = await getDb()
    .update(contentEntries)
    .set({
      status: "removed",
      deletedAt: now,
      updatedAt: now,
      updatedById: auth.profile.id,
    })
    .where(eq(contentEntries.id, id))
    .returning();
  if (!updated.length) {
    return privateJson({ error: "Conteúdo não encontrado." }, { status: 404 });
  }
  await auditContent(
    auth.profile,
    "content.remove",
    updated[0].type,
    id,
    {},
    reason,
  );
  return privateJson({ entry: updated[0] });
}

async function adminRateLimit(email: string) {
  const limit = await consumeRateLimit(email, "admin");
  if (limit.allowed) return null;
  return privateJson(
    {
      error:
        limit.reason === "unavailable"
          ? "Banco temporariamente indisponível."
          : "Limite administrativo atingido.",
    },
    { status: limit.reason === "unavailable" ? 503 : 429 },
  );
}

async function auditContent(
  profile: { id: string; role: "user" | "moderator" | "admin" },
  action: string,
  targetType: string,
  targetId: string,
  metadata: Record<string, unknown>,
  reason: string | null = null,
) {
  await getDb()
    .insert(moderationActions)
    .values({
      id: crypto.randomUUID(),
      actorId: profile.id,
      actorRole: profile.role === "admin" ? "admin" : "moderator",
      action,
      targetType,
      targetId,
      reason,
      metadata: JSON.stringify(metadata),
      createdAt: new Date().toISOString(),
    });
}

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
