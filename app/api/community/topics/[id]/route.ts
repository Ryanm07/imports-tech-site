import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { communityReplies, communityTopics, profiles } from "@/db/schema";
import { toPublicReply, toPublicTopic } from "@/lib/community-domain";
import { privateJson } from "@/lib/http";
import { getWritableProfile } from "@/lib/profiles";
import { sameOriginRequest, validateCommunityPost } from "@/lib/security";
import { requireApiUser } from "@/lib/server-auth";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  if (process.env.COMMUNITY_ENABLED !== "true") {
    return privateJson({ error: "Comunidade em breve." }, { status: 503 });
  }
  const { id } = await params;
  const db = getDb();
  const topics = await db
    .select({
      id: communityTopics.id,
      category: communityTopics.category,
      title: communityTopics.title,
      body: communityTopics.body,
      authorId: profiles.id,
      authorDisplayName: profiles.displayName,
      replyCount: communityTopics.replyCount,
      createdAt: communityTopics.createdAt,
      updatedAt: communityTopics.updatedAt,
    })
    .from(communityTopics)
    .innerJoin(profiles, eq(communityTopics.authorId, profiles.id))
    .where(
      and(eq(communityTopics.id, id), eq(communityTopics.status, "published")),
    )
    .limit(1);
  if (!topics[0]) {
    return Response.json({ error: "Tópico não encontrado." }, { status: 404 });
  }

  const replies = await db
    .select({
      id: communityReplies.id,
      topicId: communityReplies.topicId,
      body: communityReplies.body,
      authorId: profiles.id,
      authorDisplayName: profiles.displayName,
      createdAt: communityReplies.createdAt,
      updatedAt: communityReplies.updatedAt,
    })
    .from(communityReplies)
    .innerJoin(profiles, eq(communityReplies.authorId, profiles.id))
    .where(
      and(
        eq(communityReplies.topicId, id),
        eq(communityReplies.status, "published"),
      ),
    );

  return Response.json({
    topic: toPublicTopic(topics[0]),
    replies: replies.map(toPublicReply),
  });
}

export async function PATCH(request: Request, { params }: Context) {
  if (process.env.COMMUNITY_ENABLED !== "true") {
    return privateJson({ error: "Comunidade em breve." }, { status: 503 });
  }
  if (!sameOriginRequest(request)) {
    return privateJson({ error: "Origem inválida." }, { status: 403 });
  }
  const auth = await requireApiUser();
  if (auth.kind === "error") return auth.error;
  const profile = await getWritableProfile(auth.user);
  if (!profile) {
    return privateJson(
      { error: "Conta impedida de publicar." },
      { status: 403 },
    );
  }

  const { id } = await params;
  const input = await request.json().catch(() => ({}));
  const validated = validateCommunityPost(input.title, input.body);
  if (validated.errors.length) {
    return privateJson({ errors: validated.errors }, { status: 400 });
  }

  const db = getDb();
  const rows = await db
    .select({ id: communityTopics.id, createdAt: communityTopics.createdAt })
    .from(communityTopics)
    .where(
      and(
        eq(communityTopics.id, id),
        eq(communityTopics.authorId, profile.id),
        eq(communityTopics.status, "published"),
      ),
    )
    .limit(1);
  if (!rows[0]) {
    return privateJson({ error: "Tópico não encontrado." }, { status: 404 });
  }
  if (Date.now() - new Date(rows[0].createdAt).getTime() > 30 * 60_000) {
    return privateJson(
      { error: "O prazo de edição terminou." },
      { status: 403 },
    );
  }

  const updated = await db
    .update(communityTopics)
    .set({
      title: validated.title,
      body: validated.body,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(communityTopics.id, id))
    .returning({ id: communityTopics.id });
  if (!updated.length) {
    return privateJson({ error: "Tópico não encontrado." }, { status: 404 });
  }
  return privateJson({ ok: true });
}

export async function DELETE(request: Request, { params }: Context) {
  if (process.env.COMMUNITY_ENABLED !== "true") {
    return privateJson({ error: "Comunidade em breve." }, { status: 503 });
  }
  if (!sameOriginRequest(request)) {
    return privateJson({ error: "Origem inválida." }, { status: 403 });
  }
  const auth = await requireApiUser();
  if (auth.kind === "error") return auth.error;
  const profile = await getWritableProfile(auth.user);
  if (!profile) {
    return privateJson(
      { error: "Conta impedida de publicar." },
      { status: 403 },
    );
  }

  const { id } = await params;
  const now = new Date().toISOString();
  const result = await getDb()
    .update(communityTopics)
    .set({ status: "removed", deletedAt: now, updatedAt: now })
    .where(
      and(eq(communityTopics.id, id), eq(communityTopics.authorId, profile.id)),
    )
    .returning({ id: communityTopics.id });
  if (!result.length) {
    return privateJson({ error: "Tópico não encontrado." }, { status: 404 });
  }
  return privateJson({ ok: true });
}
