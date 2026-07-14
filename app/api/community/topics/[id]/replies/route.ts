import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { communityReplies, communityTopics, profiles } from "@/db/schema";
import { toPublicReply } from "@/lib/community-domain";
import { privateJson } from "@/lib/http";
import { getWritableProfile } from "@/lib/profiles";
import { consumeRateLimit } from "@/lib/rate-limit";
import {
  countLinks,
  sameOriginRequest,
  sanitizePlainText,
} from "@/lib/security";
import { requireApiUser } from "@/lib/server-auth";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  if (process.env.COMMUNITY_ENABLED !== "true") {
    return privateJson({ error: "Comunidade em breve." }, { status: 503 });
  }
  const { id } = await params;
  const replies = await getDb()
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
  return Response.json({ replies: replies.map(toPublicReply) });
}

export async function POST(request: Request, { params }: Context) {
  if (process.env.COMMUNITY_ENABLED !== "true") {
    return privateJson({ error: "Comunidade em breve." }, { status: 503 });
  }
  if (!sameOriginRequest(request)) {
    return privateJson({ error: "Origem inválida." }, { status: 403 });
  }
  const auth = await requireApiUser();
  if (auth.kind === "error") return auth.error;

  const limit = await consumeRateLimit(auth.user.email, "reply");
  if (!limit.allowed) {
    return privateJson(
      {
        error:
          limit.reason === "unavailable"
            ? "Respostas temporariamente indisponíveis."
            : "Limite temporário atingido.",
      },
      { status: limit.reason === "unavailable" ? 503 : 429 },
    );
  }

  const profile = await getWritableProfile(auth.user);
  if (!profile) {
    return privateJson(
      { error: "Sua conta não pode responder no momento." },
      { status: 403 },
    );
  }

  const { id } = await params;
  const input = await request.json().catch(() => ({}));
  const body = sanitizePlainText(input.body, 2000);
  if (body.length < 4 || countLinks(body) > 2) {
    return privateJson(
      { error: "Resposta inválida ou com links demais." },
      { status: 400 },
    );
  }

  const db = getDb();
  const topics = await db
    .select({ id: communityTopics.id })
    .from(communityTopics)
    .where(
      and(eq(communityTopics.id, id), eq(communityTopics.status, "published")),
    )
    .limit(1);
  if (!topics[0]) {
    return privateJson({ error: "Tópico não encontrado." }, { status: 404 });
  }

  const now = new Date().toISOString();
  const reply = {
    id: crypto.randomUUID(),
    topicId: id,
    body,
    authorId: profile.id,
    status: "published" as const,
    likeCount: 0,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  await db.insert(communityReplies).values(reply);
  await db
    .update(communityTopics)
    .set({
      replyCount: sql`${communityTopics.replyCount} + 1`,
      updatedAt: now,
    })
    .where(eq(communityTopics.id, id));

  return privateJson(
    {
      reply: toPublicReply({
        ...reply,
        authorDisplayName: profile.displayName,
      }),
    },
    { status: 201 },
  );
}
