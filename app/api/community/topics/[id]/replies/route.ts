import { and, eq, gt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { wallReplies, wallTopics } from "@/db/schema";
import { privateJson } from "@/lib/http";
import {
  statusForRisk,
  toPublicWallReply,
  validateWallReply,
  wallContentHash,
} from "@/lib/wall-domain";
import { prepareWallMutation, wallIsEnabled } from "@/lib/wall-request";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  if (!wallIsEnabled()) {
    return privateJson({ error: "Mural em breve." }, { status: 503 });
  }
  const { id } = await params;
  const rows = await getDb()
    .select({
      id: wallReplies.id,
      topicId: wallReplies.topicId,
      displayName: wallReplies.displayName,
      body: wallReplies.body,
      isOfficial: wallReplies.isOfficial,
      createdAt: wallReplies.createdAt,
      updatedAt: wallReplies.updatedAt,
    })
    .from(wallReplies)
    .where(
      and(eq(wallReplies.topicId, id), eq(wallReplies.status, "published")),
    )
    .orderBy(wallReplies.createdAt);
  return privateJson({ replies: rows.map(toPublicWallReply) });
}

export async function POST(request: Request, { params }: Context) {
  const prepared = await prepareWallMutation(request, "reply");
  if (!prepared.ok) return prepared.response;
  const validated = validateWallReply(prepared.input);
  if (!validated.ok) {
    return privateJson({ errors: validated.errors }, { status: 400 });
  }

  const { id: topicId } = await params;
  const db = getDb();
  const topics = await db
    .select({ id: wallTopics.id, closedAt: wallTopics.closedAt })
    .from(wallTopics)
    .where(and(eq(wallTopics.id, topicId), eq(wallTopics.status, "published")))
    .limit(1);
  if (!topics[0]) {
    return privateJson(
      { error: "Publicação não encontrada." },
      { status: 404 },
    );
  }
  if (topics[0].closedAt) {
    return privateJson(
      { error: "Esta conversa está encerrada." },
      { status: 409 },
    );
  }

  const contentHash = await wallContentHash(topicId, validated.value.body);
  const duplicate = await db
    .select({ id: wallReplies.id })
    .from(wallReplies)
    .where(
      and(
        eq(wallReplies.contentHash, contentHash),
        gt(
          wallReplies.createdAt,
          new Date(Date.now() - 24 * 60 * 60_000).toISOString(),
        ),
      ),
    )
    .limit(1);
  if (duplicate[0]) {
    return privateJson(
      { error: "Uma resposta igual já foi enviada recentemente." },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();
  const status = statusForRisk(validated.risk);
  const reply = {
    id: crypto.randomUUID(),
    topicId,
    displayName: validated.value.displayName,
    body: validated.value.body,
    status,
    isOfficial: false,
    identityHash: prepared.identityHash,
    contentHash,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  } as const;
  await db.insert(wallReplies).values(reply);
  if (status === "published") {
    await db
      .update(wallTopics)
      .set({ replyCount: sql`${wallTopics.replyCount} + 1`, updatedAt: now })
      .where(eq(wallTopics.id, topicId));
  }

  if (status !== "published") {
    return privateJson(
      {
        accepted: true,
        status: "pending",
        message: "Resposta recebida para análise.",
      },
      { status: 202 },
    );
  }
  return privateJson({ reply: toPublicWallReply(reply) }, { status: 201 });
}
