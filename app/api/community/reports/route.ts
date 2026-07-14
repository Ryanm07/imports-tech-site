import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/db";
import {
  communityReplies,
  communityReports,
  communityTopics,
} from "@/db/schema";
import { privateJson } from "@/lib/http";
import { getWritableProfile } from "@/lib/profiles";
import { consumeRateLimit } from "@/lib/rate-limit";
import { sameOriginRequest, validateReportInput } from "@/lib/security";
import { requireApiUser } from "@/lib/server-auth";

export async function POST(request: Request) {
  if (process.env.COMMUNITY_ENABLED !== "true") {
    return privateJson({ error: "Comunidade em breve." }, { status: 503 });
  }
  if (!sameOriginRequest(request)) {
    return privateJson({ error: "Origem inválida." }, { status: 403 });
  }
  const auth = await requireApiUser();
  if (auth.kind === "error") return auth.error;

  const limit = await consumeRateLimit(auth.user.email, "report");
  if (!limit.allowed) {
    return privateJson(
      {
        error:
          limit.reason === "unavailable"
            ? "Denúncias temporariamente indisponíveis."
            : "Limite de denúncias atingido.",
      },
      { status: limit.reason === "unavailable" ? 503 : 429 },
    );
  }

  const profile = await getWritableProfile(auth.user);
  if (!profile) {
    return privateJson(
      { error: "Conta impedida de denunciar." },
      { status: 403 },
    );
  }

  const input = await request.json().catch(() => ({}));
  const { targetType, targetId, reason, errors } = validateReportInput(input);
  if (!targetType || errors.length) {
    return privateJson({ error: "Denúncia inválida." }, { status: 400 });
  }

  const db = getDb();
  const target =
    targetType === "topic"
      ? await db
          .select({ id: communityTopics.id })
          .from(communityTopics)
          .where(
            and(
              eq(communityTopics.id, targetId),
              ne(communityTopics.status, "removed"),
            ),
          )
          .limit(1)
      : await db
          .select({ id: communityReplies.id })
          .from(communityReplies)
          .where(
            and(
              eq(communityReplies.id, targetId),
              ne(communityReplies.status, "removed"),
            ),
          )
          .limit(1);
  if (!target[0]) {
    return privateJson({ error: "Conteúdo não encontrado." }, { status: 404 });
  }

  const duplicate = await db
    .select({ id: communityReports.id })
    .from(communityReports)
    .where(
      and(
        eq(communityReports.reporterId, profile.id),
        eq(communityReports.targetType, targetType),
        eq(communityReports.targetId, targetId),
        eq(communityReports.status, "open"),
      ),
    )
    .limit(1);
  if (duplicate[0]) {
    return privateJson(
      { error: "Você já possui uma denúncia aberta para este conteúdo." },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();
  try {
    await db.insert(communityReports).values({
      id: crypto.randomUUID(),
      reporterId: profile.id,
      targetType,
      targetId,
      reason,
      status: "open",
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      resolvedById: null,
    });
  } catch {
    return privateJson(
      { error: "Você já possui uma denúncia aberta para este conteúdo." },
      { status: 409 },
    );
  }
  return privateJson({ ok: true }, { status: 201 });
}
