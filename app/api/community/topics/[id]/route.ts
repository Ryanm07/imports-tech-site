import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { wallCategories, wallReplies, wallTopics } from "@/db/schema";
import { privateJson } from "@/lib/http";
import { toPublicWallReply, toPublicWallTopic } from "@/lib/wall-domain";
import { wallIsEnabled } from "@/lib/wall-request";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  if (!wallIsEnabled()) {
    return privateJson({ error: "Mural em breve." }, { status: 503 });
  }
  const { id } = await params;
  const db = getDb();
  const topics = await db
    .select({
      id: wallTopics.id,
      categoryId: wallCategories.id,
      categoryName: wallCategories.name,
      categoryDescription: wallCategories.description,
      categoryStatus: wallCategories.status,
      displayName: wallTopics.displayName,
      title: wallTopics.title,
      body: wallTopics.body,
      isOfficial: wallTopics.isOfficial,
      replyCount: wallTopics.replyCount,
      closedAt: wallTopics.closedAt,
      pinnedAt: wallTopics.pinnedAt,
      createdAt: wallTopics.createdAt,
      updatedAt: wallTopics.updatedAt,
    })
    .from(wallTopics)
    .innerJoin(wallCategories, eq(wallTopics.categoryId, wallCategories.id))
    .where(and(eq(wallTopics.id, id), eq(wallTopics.status, "published")))
    .limit(1);
  if (!topics[0]) {
    return privateJson(
      { error: "Publicação não encontrada." },
      { status: 404 },
    );
  }

  const replies = await db
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

  return privateJson({
    topic: toPublicWallTopic(topics[0]),
    replies: replies.map(toPublicWallReply),
  });
}
