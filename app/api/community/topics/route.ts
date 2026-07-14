import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { communityTopics, profiles } from "@/db/schema";
import { communityCategories } from "@/lib/site-data";
import { consumeRateLimit } from "@/lib/rate-limit";
import { sameOriginRequest, validateCommunityPost } from "@/lib/security";
import { requireApiUser } from "@/lib/server-auth";

function disabled() { return process.env.COMMUNITY_ENABLED !== "true"; }
export async function GET() { if (disabled()) return Response.json({ error: "Comunidade em breve." }, { status: 503 }); const rows = await getDb().select().from(communityTopics).where(eq(communityTopics.status, "published")).orderBy(desc(communityTopics.createdAt)).limit(50); return Response.json({ topics: rows }); }
export async function POST(request: Request) {
  if (disabled()) return Response.json({ error: "Comunidade em breve." }, { status: 503 });
  if (!sameOriginRequest(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  const auth = await requireApiUser(); if ("error" in auth) return auth.error;
  const body = await request.json().catch(() => ({})); const validated = validateCommunityPost(body.title, body.body);
  if (validated.errors.length) return Response.json({ errors: validated.errors }, { status: 400 });
  if (!communityCategories.includes(body.category)) return Response.json({ error: "Categoria inválida." }, { status: 400 });
  if (!await consumeRateLimit(auth.user.email, "topic", 5)) return Response.json({ error: "Limite temporário atingido. Tente novamente mais tarde." }, { status: 429 });
  const db = getDb(); const now = new Date().toISOString();
  await db.insert(profiles).values({ email: auth.user.email, displayName: auth.user.displayName, role: "user", status: "active", createdAt: now, updatedAt: now }).onConflictDoNothing();
  const profile = await db.select().from(profiles).where(eq(profiles.email, auth.user.email)).limit(1);
  if (profile[0]?.status !== "active") return Response.json({ error: "Sua conta não pode publicar no momento." }, { status: 403 });
  const topic = { id: crypto.randomUUID(), category: body.category, title: validated.title, body: validated.body, authorEmail: auth.user.email, status: "published" as const, replyCount: 0, likeCount: 0, createdAt: now, updatedAt: now, deletedAt: null };
  await db.insert(communityTopics).values(topic); return Response.json({ topic }, { status: 201 });
}
