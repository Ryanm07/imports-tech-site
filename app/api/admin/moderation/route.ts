import { and, asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  ownerActions,
  wallBlocks,
  wallCategories,
  wallReplies,
  wallReports,
  wallTopics,
} from "@/db/schema";
import { privateJson } from "@/lib/http";
import { ownerRateLimitIdentity, PUBLIC_OWNER } from "@/lib/owner-domain";
import { consumeRateLimit } from "@/lib/rate-limit";
import { sameOriginRequest, sanitizePlainText } from "@/lib/security";
import { requireOwnerApi, type OwnerAccount } from "@/lib/server-auth";
import {
  validateWallReply,
  validateWallTopic,
  wallContentHash,
} from "@/lib/wall-domain";

const PAGE_SIZE = 50;
const REASON_REQUIRED = new Set([
  "hide",
  "remove",
  "spam",
  "hard-delete",
  "block-hash",
  "dismiss-report",
]);

export async function GET(request: Request) {
  if (disabled())
    return privateJson({ error: "Painel desativado." }, { status: 503 });
  const auth = await requireOwnerApi();
  if (auth.kind === "error") return auth.error;
  const page = positiveInteger(
    new URL(request.url).searchParams.get("page"),
    1,
  );
  const offset = (page - 1) * PAGE_SIZE;
  const db = getDb();

  const [topics, replies, reports, categories, blocks, history] =
    await Promise.all([
      db
        .select()
        .from(wallTopics)
        .orderBy(desc(wallTopics.createdAt))
        .limit(PAGE_SIZE)
        .offset(offset),
      db
        .select()
        .from(wallReplies)
        .orderBy(desc(wallReplies.createdAt))
        .limit(PAGE_SIZE)
        .offset(offset),
      db
        .select()
        .from(wallReports)
        .orderBy(desc(wallReports.createdAt))
        .limit(PAGE_SIZE)
        .offset(offset),
      db
        .select()
        .from(wallCategories)
        .orderBy(asc(wallCategories.position), asc(wallCategories.name)),
      db
        .select()
        .from(wallBlocks)
        .orderBy(desc(wallBlocks.createdAt))
        .limit(PAGE_SIZE),
      db
        .select()
        .from(ownerActions)
        .orderBy(desc(ownerActions.createdAt))
        .limit(PAGE_SIZE),
    ]);

  return privateJson({
    topics,
    replies,
    reports,
    categories,
    blocks,
    history,
    page,
    hasMore:
      topics.length === PAGE_SIZE ||
      replies.length === PAGE_SIZE ||
      reports.length === PAGE_SIZE,
    currentRole: "owner",
  });
}

export async function POST(request: Request) {
  const owner = await authorizeMutation(request);
  if (owner instanceof Response) return owner;
  const input = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const action = sanitizePlainText(input.action, 40);
  const targetType = sanitizePlainText(input.targetType, 30);
  const targetId = sanitizePlainText(input.targetId, 120);
  const reason = sanitizePlainText(input.reason, 500);
  if (!action || !targetType) {
    return privateJson(
      { error: "Ação e tipo de alvo são obrigatórios." },
      { status: 400 },
    );
  }
  if (REASON_REQUIRED.has(action) && reason.length < 8) {
    return privateJson(
      { error: "Informe um motivo com pelo menos 8 caracteres." },
      { status: 400 },
    );
  }
  if (targetType === "owner" || targetType === "owner-account") {
    return privateJson(
      { error: "A conta proprietária é protegida." },
      { status: 403 },
    );
  }

  try {
    if (targetType === "topic") {
      await topicAction(owner, action, targetId, input, reason);
    } else if (targetType === "reply") {
      await replyAction(owner, action, targetId, input, reason);
    } else if (targetType === "report") {
      await reportAction(owner, action, targetId, reason);
    } else if (targetType === "category") {
      await categoryAction(owner, action, targetId, input, reason);
    } else if (targetType === "block") {
      await blockAction(owner, action, targetId, reason);
    } else {
      return privateJson({ error: "Tipo de alvo inválido." }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof ModerationError) {
      return privateJson({ error: error.message }, { status: error.status });
    }
    return privateJson(
      { error: "Não foi possível concluir a ação." },
      { status: 500 },
    );
  }
  return privateJson({ ok: true });
}

async function blockAction(
  owner: OwnerAccount,
  action: string,
  id: string,
  reason: string,
) {
  if (action !== "lift") {
    throw new ModerationError("Ação inválida para bloqueio.", 400);
  }
  const result = await getDb()
    .update(wallBlocks)
    .set({ active: false, liftedAt: new Date().toISOString() })
    .where(eq(wallBlocks.id, id))
    .returning({ id: wallBlocks.id });
  if (!result[0]) throw new ModerationError("Bloqueio não encontrado.", 404);
  await audit(owner, "wall.block.lift", "block", id, reason || null, {});
}

async function topicAction(
  owner: OwnerAccount,
  action: string,
  id: string,
  input: Record<string, unknown>,
  reason: string,
) {
  const db = getDb();
  if (action === "official-create") {
    const validated = validateWallTopic({ ...input, displayName: "Visitante" });
    if (!validated.ok)
      throw new ModerationError(validated.errors.join(" "), 400);
    const category = await db
      .select()
      .from(wallCategories)
      .where(eq(wallCategories.id, validated.value.categoryId))
      .limit(1);
    if (!category[0])
      throw new ModerationError("Categoria não encontrada.", 404);
    const now = new Date().toISOString();
    const createdId = crypto.randomUUID();
    await db.insert(wallTopics).values({
      id: createdId,
      categoryId: category[0].id,
      displayName: PUBLIC_OWNER.displayName,
      title: validated.value.title,
      body: validated.value.body,
      status: "published",
      isOfficial: true,
      identityHash: null,
      contentHash: await wallContentHash(
        validated.value.title,
        validated.value.body,
      ),
      replyCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    await audit(owner, "wall.topic.official-create", "topic", createdId, null, {
      categoryId: category[0].id,
    });
    return;
  }
  const rows = await db
    .select()
    .from(wallTopics)
    .where(eq(wallTopics.id, id))
    .limit(1);
  const topic = rows[0];
  if (!topic) throw new ModerationError("Publicação não encontrada.", 404);
  const now = new Date().toISOString();

  if (["hide", "restore", "remove", "spam"].includes(action)) {
    const status = action === "restore" ? "published" : action;
    await db
      .update(wallTopics)
      .set({
        status: status as "published" | "hidden" | "removed" | "spam",
        deletedAt: status === "removed" ? now : null,
        updatedAt: now,
      })
      .where(eq(wallTopics.id, id));
  } else if (action === "close" || action === "reopen") {
    await db
      .update(wallTopics)
      .set({ closedAt: action === "close" ? now : null, updatedAt: now })
      .where(eq(wallTopics.id, id));
  } else if (action === "pin" || action === "unpin") {
    await db
      .update(wallTopics)
      .set({ pinnedAt: action === "pin" ? now : null, updatedAt: now })
      .where(eq(wallTopics.id, id));
  } else if (action === "move") {
    const categoryId = sanitizePlainText(input.categoryId, 80);
    const category = await db
      .select({ id: wallCategories.id })
      .from(wallCategories)
      .where(eq(wallCategories.id, categoryId))
      .limit(1);
    if (!category[0])
      throw new ModerationError("Categoria não encontrada.", 404);
    await db
      .update(wallTopics)
      .set({ categoryId, updatedAt: now })
      .where(eq(wallTopics.id, id));
  } else if (action === "block-hash") {
    if (!topic.identityHash)
      throw new ModerationError(
        "Publicação oficial não possui origem bloqueável.",
        400,
      );
    await createBlock(owner, topic.identityHash, input, reason);
  } else if (action === "hard-delete") {
    requireHardDeleteConfirmation(input);
    const replies = await db
      .select({ id: wallReplies.id })
      .from(wallReplies)
      .where(eq(wallReplies.topicId, id));
    for (const reply of replies) {
      await db
        .delete(wallReports)
        .where(
          and(
            eq(wallReports.targetType, "reply"),
            eq(wallReports.targetId, reply.id),
          ),
        );
    }
    await db
      .delete(wallReports)
      .where(
        and(eq(wallReports.targetType, "topic"), eq(wallReports.targetId, id)),
      );
    await db.delete(wallTopics).where(eq(wallTopics.id, id));
  } else {
    throw new ModerationError("Ação inválida para publicação.", 400);
  }
  await audit(owner, `wall.topic.${action}`, "topic", id, reason || null, {});
}

async function replyAction(
  owner: OwnerAccount,
  action: string,
  id: string,
  input: Record<string, unknown>,
  reason: string,
) {
  const db = getDb();
  if (action === "official-create") {
    const topicId = sanitizePlainText(input.topicId, 120);
    const validated = validateWallReply({ ...input, displayName: "Visitante" });
    if (!validated.ok)
      throw new ModerationError(validated.errors.join(" "), 400);
    const topic = await db
      .select({ id: wallTopics.id })
      .from(wallTopics)
      .where(eq(wallTopics.id, topicId))
      .limit(1);
    if (!topic[0]) throw new ModerationError("Publicação não encontrada.", 404);
    const now = new Date().toISOString();
    const createdId = crypto.randomUUID();
    await db.insert(wallReplies).values({
      id: createdId,
      topicId,
      displayName: PUBLIC_OWNER.displayName,
      body: validated.value.body,
      status: "published",
      isOfficial: true,
      identityHash: null,
      contentHash: await wallContentHash(topicId, validated.value.body),
      createdAt: now,
      updatedAt: now,
    });
    await recomputeReplyCount(topicId);
    await audit(owner, "wall.reply.official-create", "reply", createdId, null, {
      topicId,
    });
    return;
  }
  const rows = await db
    .select()
    .from(wallReplies)
    .where(eq(wallReplies.id, id))
    .limit(1);
  const reply = rows[0];
  if (!reply) throw new ModerationError("Resposta não encontrada.", 404);
  const now = new Date().toISOString();
  if (["hide", "restore", "remove", "spam"].includes(action)) {
    const status = action === "restore" ? "published" : action;
    await db
      .update(wallReplies)
      .set({
        status: status as "published" | "hidden" | "removed" | "spam",
        deletedAt: status === "removed" ? now : null,
        updatedAt: now,
      })
      .where(eq(wallReplies.id, id));
  } else if (action === "block-hash") {
    if (!reply.identityHash)
      throw new ModerationError(
        "Resposta oficial não possui origem bloqueável.",
        400,
      );
    await createBlock(owner, reply.identityHash, input, reason);
  } else if (action === "hard-delete") {
    requireHardDeleteConfirmation(input);
    await db
      .delete(wallReports)
      .where(
        and(eq(wallReports.targetType, "reply"), eq(wallReports.targetId, id)),
      );
    await db.delete(wallReplies).where(eq(wallReplies.id, id));
  } else {
    throw new ModerationError("Ação inválida para resposta.", 400);
  }
  await recomputeReplyCount(reply.topicId);
  await audit(owner, `wall.reply.${action}`, "reply", id, reason || null, {
    topicId: reply.topicId,
  });
}

async function reportAction(
  owner: OwnerAccount,
  action: string,
  id: string,
  reason: string,
) {
  const status =
    action === "resolve-report"
      ? "resolved"
      : action === "dismiss-report"
        ? "dismissed"
        : action === "review-report"
          ? "reviewing"
          : null;
  if (!status) throw new ModerationError("Ação inválida para denúncia.", 400);
  const now = new Date().toISOString();
  const result = await getDb()
    .update(wallReports)
    .set({
      status,
      updatedAt: now,
      resolvedAt: status === "reviewing" ? null : now,
      resolvedByOwnerId: status === "reviewing" ? null : owner.id,
    })
    .where(eq(wallReports.id, id))
    .returning({ id: wallReports.id });
  if (!result[0]) throw new ModerationError("Denúncia não encontrada.", 404);
  await audit(owner, `wall.report.${action}`, "report", id, reason || null, {});
}

async function categoryAction(
  owner: OwnerAccount,
  action: string,
  id: string,
  input: Record<string, unknown>,
  reason: string,
) {
  const db = getDb();
  const name = sanitizePlainText(input.name, 80);
  const description = sanitizePlainText(input.description, 300);
  const now = new Date().toISOString();
  if (action === "create") {
    if (name.length < 3)
      throw new ModerationError("Nome de categoria inválido.", 400);
    const categoryId = slugify(name);
    await db.insert(wallCategories).values({
      id: categoryId,
      name,
      description,
      status: "active",
      position: Number.isInteger(Number(input.position))
        ? Number(input.position)
        : 99,
      createdByOwnerId: owner.id,
      createdAt: now,
      updatedAt: now,
    });
    await audit(
      owner,
      "wall.category.create",
      "category",
      categoryId,
      null,
      {},
    );
    return;
  }
  const rows = await db
    .select()
    .from(wallCategories)
    .where(eq(wallCategories.id, id))
    .limit(1);
  if (!rows[0]) throw new ModerationError("Categoria não encontrada.", 404);
  if (action === "archive" || action === "restore") {
    await db
      .update(wallCategories)
      .set({
        status: action === "archive" ? "archived" : "active",
        updatedAt: now,
      })
      .where(eq(wallCategories.id, id));
  } else if (action === "update") {
    if (name.length < 3)
      throw new ModerationError("Nome de categoria inválido.", 400);
    await db
      .update(wallCategories)
      .set({
        name,
        description,
        position: Number.isInteger(Number(input.position))
          ? Number(input.position)
          : rows[0].position,
        updatedAt: now,
      })
      .where(eq(wallCategories.id, id));
  } else {
    throw new ModerationError("Ação inválida para categoria.", 400);
  }
  await audit(
    owner,
    `wall.category.${action}`,
    "category",
    id,
    reason || null,
    {},
  );
}

async function createBlock(
  owner: OwnerAccount,
  identityHash: string,
  input: Record<string, unknown>,
  reason: string,
) {
  const hours = Math.min(Math.max(Number(input.blockHours) || 24, 1), 24 * 365);
  const now = new Date();
  await getDb()
    .insert(wallBlocks)
    .values({
      id: crypto.randomUUID(),
      identityHash,
      reason,
      expiresAt: new Date(now.getTime() + hours * 60 * 60_000).toISOString(),
      active: true,
      createdByOwnerId: owner.id,
      createdAt: now.toISOString(),
      liftedAt: null,
    });
}

async function recomputeReplyCount(topicId: string) {
  await getDb()
    .update(wallTopics)
    .set({
      replyCount: sql<number>`(select count(*) from wall_replies where topic_id = ${topicId} and status = 'published')`,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(wallTopics.id, topicId));
}

function requireHardDeleteConfirmation(input: Record<string, unknown>) {
  if (input.confirmation !== "EXCLUIR PERMANENTEMENTE") {
    throw new ModerationError("Confirmação reforçada inválida.", 400);
  }
}

async function authorizeMutation(
  request: Request,
): Promise<OwnerAccount | Response> {
  if (disabled())
    return privateJson({ error: "Painel desativado." }, { status: 503 });
  if (!sameOriginRequest(request))
    return privateJson({ error: "Origem inválida." }, { status: 403 });
  const auth = await requireOwnerApi();
  if (auth.kind === "error") return auth.error;
  const limit = await consumeRateLimit(
    await ownerRateLimitIdentity(auth.owner.id),
    "admin",
  );
  if (!limit.allowed) {
    return privateJson(
      {
        error:
          limit.reason === "unavailable"
            ? "Banco indisponível."
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
  reason: string | null,
  metadata: Record<string, unknown>,
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

function disabled() {
  return process.env.ADMIN_ENABLED !== "true";
}

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

class ModerationError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
