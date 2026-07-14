import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { moderationActions, profiles } from "@/db/schema";
import { privateJson } from "@/lib/http";
import { sameOriginRequest } from "@/lib/security";
import { requireApiUser } from "@/lib/server-auth";

export async function DELETE(request: Request) {
  if (process.env.COMMUNITY_ENABLED !== "true") {
    return privateJson({ error: "Comunidade em breve." }, { status: 503 });
  }
  if (!sameOriginRequest(request)) {
    return privateJson({ error: "Origem inválida." }, { status: 403 });
  }
  const auth = await requireApiUser();
  if (auth.kind === "error") return auth.error;

  const db = getDb();
  const current = await db
    .select({ id: profiles.id, role: profiles.role })
    .from(profiles)
    .where(eq(profiles.email, auth.user.email.trim().toLowerCase()))
    .limit(1);
  if (!current[0]) {
    return privateJson({ ok: true });
  }
  if (current[0].role === "admin") {
    return privateJson(
      {
        error:
          "Transfira a função administrativa antes de anonimizar esta conta.",
      },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();
  const updated = await db
    .update(profiles)
    .set({
      email: `deleted:${crypto.randomUUID()}`,
      displayName: "Usuário removido",
      role: "user",
      status: "deleted",
      blockType: null,
      blockedUntil: null,
      updatedAt: now,
      deletedAt: now,
    })
    .where(eq(profiles.id, current[0].id))
    .returning({ id: profiles.id });
  if (!updated.length) {
    return privateJson(
      { error: "Não foi possível anonimizar a conta." },
      { status: 503 },
    );
  }

  await db.insert(moderationActions).values({
    id: crypto.randomUUID(),
    actorId: null,
    actorRole: "system",
    action: "account.anonymize",
    targetType: "profile",
    targetId: current[0].id,
    reason: "Solicitação do titular",
    metadata: null,
    createdAt: now,
  });
  return privateJson({ ok: true });
}
