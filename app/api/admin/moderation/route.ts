import { and, count, desc, eq, or } from "drizzle-orm";
import { getDb } from "@/db";
import {
  communityReplies,
  communityReports,
  communityTopics,
  moderationActions,
  profiles,
} from "@/db/schema";
import { canChangeRole, type ProfileRole } from "@/lib/community-domain";
import { privateJson } from "@/lib/http";
import { consumeRateLimit } from "@/lib/rate-limit";
import { sameOriginRequest, sanitizePlainText } from "@/lib/security";
import { requireStaffApi } from "@/lib/server-auth";

const PAGE_SIZE = 20;
const DESTRUCTIVE_ACTIONS = new Set([
  "hide",
  "remove",
  "block",
  "ban",
  "role",
  "dismiss-report",
]);

export async function GET(request: Request) {
  if (process.env.ADMIN_ENABLED !== "true") {
    return privateJson({ error: "Painel desativado." }, { status: 503 });
  }
  const auth = await requireStaffApi();
  if (auth.kind === "error") return auth.error;
  const page = positiveInteger(
    new URL(request.url).searchParams.get("page"),
    1,
  );
  const db = getDb();

  const reportRows = await db
    .select({
      id: communityReports.id,
      targetType: communityReports.targetType,
      targetId: communityReports.targetId,
      reason: communityReports.reason,
      status: communityReports.status,
      createdAt: communityReports.createdAt,
      reporter: profiles.displayName,
    })
    .from(communityReports)
    .innerJoin(profiles, eq(communityReports.reporterId, profiles.id))
    .where(
      or(
        eq(communityReports.status, "open"),
        eq(communityReports.status, "reviewing"),
      ),
    )
    .orderBy(desc(communityReports.createdAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  const reports = await Promise.all(
    reportRows.map(async (report) => ({
      ...report,
      target: await getSafeTarget(report.targetType, report.targetId),
    })),
  );

  const history = await db
    .select({
      id: moderationActions.id,
      actorRole: moderationActions.actorRole,
      action: moderationActions.action,
      targetType: moderationActions.targetType,
      targetId: moderationActions.targetId,
      reason: moderationActions.reason,
      createdAt: moderationActions.createdAt,
    })
    .from(moderationActions)
    .orderBy(desc(moderationActions.createdAt))
    .limit(PAGE_SIZE);

  const users = await db
    .select({
      id: profiles.id,
      displayName: profiles.displayName,
      role: profiles.role,
      status: profiles.status,
      blockType: profiles.blockType,
      blockedUntil: profiles.blockedUntil,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .where(or(eq(profiles.role, "moderator"), eq(profiles.role, "admin")))
    .orderBy(desc(profiles.createdAt))
    .limit(100);

  return privateJson({
    reports,
    history,
    users,
    page,
    hasMore: reportRows.length === PAGE_SIZE,
    currentRole: auth.profile.role,
  });
}

export async function POST(request: Request) {
  if (process.env.ADMIN_ENABLED !== "true") {
    return privateJson({ error: "Painel desativado." }, { status: 503 });
  }
  if (!sameOriginRequest(request)) {
    return privateJson({ error: "Origem inválida." }, { status: 403 });
  }
  const auth = await requireStaffApi();
  if (auth.kind === "error") return auth.error;
  const limit = await consumeRateLimit(auth.user.email, "admin");
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

  const input = await request.json().catch(() => ({}));
  const action = sanitizePlainText(input.action, 40);
  const targetId = sanitizePlainText(input.targetId, 120);
  const targetType = sanitizePlainText(input.targetType, 30);
  const reason = sanitizePlainText(input.reason, 500);
  if (!action || !targetId || !targetType) {
    return privateJson(
      { error: "Ação e alvo são obrigatórios." },
      { status: 400 },
    );
  }
  if (DESTRUCTIVE_ACTIONS.has(action) && reason.length < 8) {
    return privateJson(
      { error: "Informe um motivo com pelo menos 8 caracteres." },
      { status: 400 },
    );
  }

  const db = getDb();
  const now = new Date().toISOString();
  let changed = false;
  let metadata: Record<string, unknown> = {};

  if (["hide", "remove", "restore"].includes(action)) {
    if (targetType !== "topic" && targetType !== "reply") {
      return privateJson(
        { error: "Tipo de conteúdo inválido." },
        { status: 400 },
      );
    }
    const status =
      action === "restore"
        ? "published"
        : action === "hide"
          ? "hidden"
          : "removed";
    const deletedAt = action === "remove" ? now : null;
    const rows =
      targetType === "topic"
        ? await db
            .update(communityTopics)
            .set({ status, deletedAt, updatedAt: now })
            .where(eq(communityTopics.id, targetId))
            .returning({ id: communityTopics.id })
        : await db
            .update(communityReplies)
            .set({ status, deletedAt, updatedAt: now })
            .where(eq(communityReplies.id, targetId))
            .returning({ id: communityReplies.id });
    changed = rows.length > 0;
  } else if (["block", "ban", "unblock"].includes(action)) {
    if (targetType !== "user") {
      return privateJson(
        { error: "Tipo de usuário inválido." },
        { status: 400 },
      );
    }
    const permanent = input.permanent === true;
    const requestedHours = Number(input.blockHours);
    const hours = Number.isFinite(requestedHours)
      ? Math.min(Math.max(Math.round(requestedHours), 1), 8760)
      : 24;
    const update =
      action === "ban"
        ? {
            status: "banned" as const,
            blockType: "permanent" as const,
            blockedUntil: null,
          }
        : action === "block"
          ? {
              status: "blocked" as const,
              blockType: permanent
                ? ("permanent" as const)
                : ("temporary" as const),
              blockedUntil: permanent
                ? null
                : new Date(Date.now() + hours * 60 * 60_000).toISOString(),
            }
          : { status: "active" as const, blockType: null, blockedUntil: null };
    const rows = await db
      .update(profiles)
      .set({ ...update, updatedAt: now })
      .where(eq(profiles.id, targetId))
      .returning({ id: profiles.id });
    changed = rows.length > 0;
    metadata = { permanent, hours: permanent ? null : hours };
  } else if (action === "role") {
    if (targetType !== "user" || auth.profile.role !== "admin") {
      return privateJson(
        { error: "Apenas administradores alteram papéis." },
        { status: 403 },
      );
    }
    const nextRole = input.role as ProfileRole;
    if (!["user", "moderator", "admin"].includes(nextRole)) {
      return privateJson({ error: "Papel inválido." }, { status: 400 });
    }
    const target = await db
      .select({ id: profiles.id, role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, targetId))
      .limit(1);
    if (!target[0]) {
      return privateJson({ error: "Usuário não encontrado." }, { status: 404 });
    }
    const adminRows = await db
      .select({ value: count() })
      .from(profiles)
      .where(and(eq(profiles.role, "admin"), eq(profiles.status, "active")));
    if (
      !canChangeRole({
        actorId: auth.profile.id,
        actorRole: auth.profile.role,
        targetId,
        nextRole,
        currentTargetRole: target[0].role,
        adminCount: adminRows[0]?.value ?? 0,
      })
    ) {
      return privateJson(
        { error: "Alteração de papel não permitida." },
        { status: 409 },
      );
    }
    const rows = await db
      .update(profiles)
      .set({ role: nextRole, updatedAt: now })
      .where(eq(profiles.id, targetId))
      .returning({ id: profiles.id });
    changed = rows.length > 0;
    metadata = { previousRole: target[0].role, nextRole };
  } else if (["resolve-report", "dismiss-report"].includes(action)) {
    if (targetType !== "report") {
      return privateJson(
        { error: "Tipo de denúncia inválido." },
        { status: 400 },
      );
    }
    const status = action === "resolve-report" ? "resolved" : "dismissed";
    const rows = await db
      .update(communityReports)
      .set({
        status,
        resolvedAt: now,
        resolvedById: auth.profile.id,
        updatedAt: now,
      })
      .where(eq(communityReports.id, targetId))
      .returning({ id: communityReports.id });
    changed = rows.length > 0;
  } else {
    return privateJson(
      { error: "Ação de moderação inválida." },
      { status: 400 },
    );
  }

  if (!changed) {
    return privateJson({ error: "Alvo não encontrado." }, { status: 404 });
  }

  await db.insert(moderationActions).values({
    id: crypto.randomUUID(),
    actorId: auth.profile.id,
    actorRole: auth.profile.role === "admin" ? "admin" : "moderator",
    action,
    targetType,
    targetId,
    reason: reason || null,
    metadata: Object.keys(metadata).length ? JSON.stringify(metadata) : null,
    createdAt: now,
  });
  return privateJson({ ok: true });
}

async function getSafeTarget(targetType: "topic" | "reply", targetId: string) {
  const db = getDb();
  if (targetType === "topic") {
    const rows = await db
      .select({
        id: communityTopics.id,
        title: communityTopics.title,
        body: communityTopics.body,
        status: communityTopics.status,
        authorId: profiles.id,
        authorDisplayName: profiles.displayName,
      })
      .from(communityTopics)
      .innerJoin(profiles, eq(communityTopics.authorId, profiles.id))
      .where(eq(communityTopics.id, targetId))
      .limit(1);
    return rows[0] || null;
  }
  const rows = await db
    .select({
      id: communityReplies.id,
      body: communityReplies.body,
      status: communityReplies.status,
      authorId: profiles.id,
      authorDisplayName: profiles.displayName,
    })
    .from(communityReplies)
    .innerJoin(profiles, eq(communityReplies.authorId, profiles.id))
    .where(eq(communityReplies.id, targetId))
    .limit(1);
  return rows[0] || null;
}

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
