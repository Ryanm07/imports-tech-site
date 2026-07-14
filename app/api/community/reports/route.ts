import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { wallReplies, wallReports, wallTopics } from "@/db/schema";
import { privateJson } from "@/lib/http";
import { validateWallReport } from "@/lib/wall-domain";
import { prepareWallMutation } from "@/lib/wall-request";

export async function POST(request: Request) {
  const prepared = await prepareWallMutation(request, "report");
  if (!prepared.ok) return prepared.response;
  const validated = validateWallReport(prepared.input);
  if (!validated.targetType || validated.errors.length) {
    return privateJson({ errors: validated.errors }, { status: 400 });
  }
  const targetType = validated.targetType as "topic" | "reply";

  const db = getDb();
  const target =
    targetType === "topic"
      ? await db
          .select({ id: wallTopics.id })
          .from(wallTopics)
          .where(
            and(
              eq(wallTopics.id, validated.targetId),
              eq(wallTopics.status, "published"),
            ),
          )
          .limit(1)
      : await db
          .select({ id: wallReplies.id })
          .from(wallReplies)
          .where(
            and(
              eq(wallReplies.id, validated.targetId),
              eq(wallReplies.status, "published"),
            ),
          )
          .limit(1);
  if (!target[0]) {
    return privateJson({ error: "Conteúdo não encontrado." }, { status: 404 });
  }

  const duplicate = await db
    .select({ id: wallReports.id })
    .from(wallReports)
    .where(
      and(
        eq(wallReports.reporterHash, prepared.identityHash),
        eq(wallReports.targetType, targetType),
        eq(wallReports.targetId, validated.targetId),
        eq(wallReports.status, "open"),
      ),
    )
    .limit(1);
  if (duplicate[0]) {
    return privateJson(
      { error: "Uma denúncia para este conteúdo já está em análise." },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();
  try {
    await db.insert(wallReports).values({
      id: crypto.randomUUID(),
      reporterHash: prepared.identityHash,
      targetType,
      targetId: validated.targetId,
      reason: validated.reason,
      status: "open",
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      resolvedByOwnerId: null,
    });
  } catch {
    return privateJson(
      { error: "Uma denúncia para este conteúdo já está em análise." },
      { status: 409 },
    );
  }
  return privateJson({ ok: true }, { status: 201 });
}
