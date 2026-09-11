import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { contentEntries, ownerActions } from "@/db/schema";
import {
  explicitContentPatch,
  sanitizeSlug,
  type ContentType,
  validateContentPayload,
} from "@/lib/content-schemas";
import { privateJson } from "@/lib/http";
import { ownerRateLimitIdentity } from "@/lib/owner-domain";
import { consumeRateLimit } from "@/lib/rate-limit";
import { sameOriginRequest, sanitizePlainText } from "@/lib/security";
import { requireOwnerApi, type OwnerAccount } from "@/lib/server-auth";
import { privateBackendEnabled } from "@/lib/server-capabilities";

const CONTENT_TYPES: ContentType[] = [
  "review",
  "find",
  "category",
  "setting",
  "timeline",
];
const CONTENT_STATUSES = [
  "draft",
  "review",
  "reviewed",
  "published",
  "archived",
  "removed",
] as const;

function disabled() {
  return !privateBackendEnabled();
}

export async function GET(request: Request) {
  if (disabled())
    return privateJson({ error: "Painel desativado." }, { status: 503 });
  const auth = await requireOwnerApi();
  if (auth.kind === "error") return auth.error;
  const page = positiveInteger(
    new URL(request.url).searchParams.get("page"),
    1,
  );
  const limit = 30;
  const entries = await getDb()
    .select()
    .from(contentEntries)
    .where(inArray(contentEntries.type, CONTENT_TYPES))
    .orderBy(desc(contentEntries.updatedAt))
    .limit(limit)
    .offset((page - 1) * limit);
  return privateJson({ entries, page, hasMore: entries.length === limit });
}

export async function POST(request: Request) {
  const owner = await authorizeMutation(request);
  if (owner instanceof Response) return owner;
  const input = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const type = CONTENT_TYPES.includes(input.type as ContentType)
    ? (input.type as ContentType)
    : null;
  const title = sanitizePlainText(input.title, 160);
  const slug = sanitizeSlug(input.slug);
  if (!type || title.length < 3 || slug.length < 3) {
    return privateJson({ error: "Conteúdo inválido." }, { status: 400 });
  }
  const validated = validateContentPayload(type, input.payload);
  if (!validated.ok)
    return privateJson({ errors: validated.errors }, { status: 400 });

  const now = new Date().toISOString();
  const entry: typeof contentEntries.$inferInsert = {
    id: crypto.randomUUID(),
    type,
    title,
    slug,
    payload: JSON.stringify(validated.payload),
    status: "draft",
    featured: false,
    createdById: null,
    updatedById: null,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    deletedAt: null,
  };
  await getDb().insert(contentEntries).values(entry);
  await audit(owner, "content.create", type, entry.id, { slug });
  return privateJson({ entry }, { status: 201 });
}

export async function PATCH(request: Request) {
  const owner = await authorizeMutation(request);
  if (owner instanceof Response) return owner;
  const input = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const patch = explicitContentPatch(input);
  const id = sanitizePlainText(input.id, 80);
  if (!id) return privateJson({ error: "ID obrigatório." }, { status: 400 });

  const db = getDb();
  const existingRows = await db
    .select()
    .from(contentEntries)
    .where(eq(contentEntries.id, id))
    .limit(1);
  const existing = existingRows[0];
  if (!existing)
    return privateJson({ error: "Conteúdo não encontrado." }, { status: 404 });

  const changes: Partial<typeof contentEntries.$inferInsert> = {
    updatedById: null,
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
    const validated = validateContentPayload(
      existing.type as ContentType,
      patch.payload,
    );
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
    if (
      typeof patch.status !== "string" ||
      !CONTENT_STATUSES.includes(
        patch.status as (typeof CONTENT_STATUSES)[number],
      )
    ) {
      return privateJson({ error: "Status inválido." }, { status: 400 });
    }
    const status = patch.status as (typeof CONTENT_STATUSES)[number];
    const payload = Object.hasOwn(patch, "payload")
      ? patch.payload
      : JSON.parse(existing.payload);
    const validated = validateContentPayload(
      existing.type as ContentType,
      payload,
    );
    if (status === "published" && !validated.ok) {
      return privateJson({ errors: validated.errors }, { status: 400 });
    }
    changes.status = status;
    changes.publishedAt =
      status === "published"
        ? existing.publishedAt || new Date().toISOString()
        : existing.publishedAt;
    changes.deletedAt = status === "removed" ? new Date().toISOString() : null;
  }

  const updated = await db
    .update(contentEntries)
    .set(changes)
    .where(eq(contentEntries.id, id))
    .returning();
  await audit(owner, "content.update", existing.type, id, {
    changedFields: Object.keys(changes).filter(
      (key) => !["updatedAt", "updatedById"].includes(key),
    ),
  });
  return privateJson({ entry: updated[0] });
}

export async function DELETE(request: Request) {
  const owner = await authorizeMutation(request);
  if (owner instanceof Response) return owner;
  const input = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
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
      updatedById: null,
    })
    .where(eq(contentEntries.id, id))
    .returning();
  if (!updated[0])
    return privateJson({ error: "Conteúdo não encontrado." }, { status: 404 });
  await audit(owner, "content.remove", updated[0].type, id, {}, reason);
  return privateJson({ entry: updated[0] });
}

async function authorizeMutation(
  request: Request,
): Promise<OwnerAccount | Response> {
  if (disabled())
    return privateJson({ error: "Painel desativado." }, { status: 503 });
  if (!sameOriginRequest(request)) {
    return privateJson({ error: "Origem inválida." }, { status: 403 });
  }
  const auth = await requireOwnerApi();
  if (auth.kind === "error") return auth.error;
  const identity = await ownerRateLimitIdentity(auth.owner.id);
  const limit = await consumeRateLimit(identity, "admin");
  if (!limit.allowed) {
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
  return auth.owner;
}

async function audit(
  owner: OwnerAccount,
  action: string,
  targetType: string,
  targetId: string,
  metadata: Record<string, unknown>,
  reason: string | null = null,
) {
  await getDb()
    .insert(ownerActions)
    .values({
      id: crypto.randomUUID(),
      actorOwnerId: owner.id,
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
