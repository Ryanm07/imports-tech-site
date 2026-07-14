import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { communityTopics, profiles } from "@/db/schema";
import { toPublicTopic } from "@/lib/community-domain";
import { privateJson } from "@/lib/http";
import { consumeRateLimit } from "@/lib/rate-limit";
import { sameOriginRequest, validateCommunityPost } from "@/lib/security";
import { requireApiUser } from "@/lib/server-auth";
import { communityCategories } from "@/lib/site-data";
import { getWritableProfile } from "@/lib/profiles";

const publicTopicColumns = {
  id: communityTopics.id,
  category: communityTopics.category,
  title: communityTopics.title,
  body: communityTopics.body,
  authorId: profiles.id,
  authorDisplayName: profiles.displayName,
  replyCount: communityTopics.replyCount,
  createdAt: communityTopics.createdAt,
  updatedAt: communityTopics.updatedAt,
};

function disabled() {
  return process.env.COMMUNITY_ENABLED !== "true";
}

export async function GET() {
  if (disabled()) {
    return privateJson({ error: "Comunidade em breve." }, { status: 503 });
  }
  const rows = await getDb()
    .select(publicTopicColumns)
    .from(communityTopics)
    .innerJoin(profiles, eq(communityTopics.authorId, profiles.id))
    .where(eq(communityTopics.status, "published"))
    .orderBy(desc(communityTopics.createdAt))
    .limit(50);
  return Response.json({ topics: rows.map(toPublicTopic) });
}

export async function POST(request: Request) {
  if (disabled()) {
    return privateJson({ error: "Comunidade em breve." }, { status: 503 });
  }
  if (!sameOriginRequest(request)) {
    return privateJson({ error: "Origem inválida." }, { status: 403 });
  }
  const auth = await requireApiUser();
  if (auth.kind === "error") return auth.error;

  const input = await request.json().catch(() => ({}));
  const validated = validateCommunityPost(input.title, input.body);
  if (validated.errors.length) {
    return privateJson({ errors: validated.errors }, { status: 400 });
  }
  if (!communityCategories.includes(input.category)) {
    return privateJson({ error: "Categoria inválida." }, { status: 400 });
  }

  const limit = await consumeRateLimit(auth.user.email, "topic");
  if (!limit.allowed) {
    return privateJson(
      {
        error:
          limit.reason === "unavailable"
            ? "Publicação temporariamente indisponível."
            : "Limite temporário atingido. Tente novamente mais tarde.",
      },
      { status: limit.reason === "unavailable" ? 503 : 429 },
    );
  }

  const profile = await getWritableProfile(auth.user);
  if (!profile) {
    return privateJson(
      { error: "Sua conta não pode publicar no momento." },
      { status: 403 },
    );
  }

  const now = new Date().toISOString();
  const topic = {
    id: crypto.randomUUID(),
    category: input.category,
    title: validated.title,
    body: validated.body,
    authorId: profile.id,
    status: "published" as const,
    replyCount: 0,
    likeCount: 0,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  await getDb().insert(communityTopics).values(topic);

  return privateJson(
    {
      topic: toPublicTopic({
        ...topic,
        authorDisplayName: profile.displayName,
      }),
    },
    { status: 201 },
  );
}
