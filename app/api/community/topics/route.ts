import { and, desc, eq, gt, like, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { wallCategories, wallTopics } from "@/db/schema";
import { privateJson } from "@/lib/http";
import {
  statusForRisk,
  toPublicWallTopic,
  validateWallTopic,
  wallContentHash,
} from "@/lib/wall-domain";
import { prepareWallMutation, wallIsEnabled } from "@/lib/wall-request";

const PAGE_SIZE = 20;
const publicTopicColumns = {
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
};

export async function GET(request: Request) {
  if (!wallIsEnabled()) {
    return privateJson({ error: "Mural em breve." }, { status: 503 });
  }
  const url = new URL(request.url);
  const page = positiveInteger(url.searchParams.get("page"), 1);
  const category = cleanFilter(url.searchParams.get("category"), 80);
  const query = cleanFilter(url.searchParams.get("q"), 80);
  const sort =
    url.searchParams.get("sort") === "replied" ? "replied" : "recent";
  const conditions = [eq(wallTopics.status, "published")];
  if (category) conditions.push(eq(wallTopics.categoryId, category));
  if (query) {
    const pattern = `%${query.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
    conditions.push(
      or(
        like(wallTopics.title, pattern),
        like(wallTopics.body, pattern),
        like(wallTopics.displayName, pattern),
      )!,
    );
  }

  try {
    const rows = await getDb()
      .select(publicTopicColumns)
      .from(wallTopics)
      .innerJoin(wallCategories, eq(wallTopics.categoryId, wallCategories.id))
      .where(and(...conditions))
      .orderBy(
        sql`${wallTopics.pinnedAt} is not null desc`,
        sort === "replied"
          ? desc(wallTopics.replyCount)
          : desc(wallTopics.createdAt),
      )
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE);
    return privateJson({
      topics: rows.map(toPublicWallTopic),
      page,
      hasMore: rows.length === PAGE_SIZE,
    });
  } catch {
    return privateJson(
      { error: "Não foi possível carregar o mural agora." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const prepared = await prepareWallMutation(request, "topic");
  if (!prepared.ok) return prepared.response;

  const validated = validateWallTopic(prepared.input);
  if (!validated.ok) {
    return privateJson({ errors: validated.errors }, { status: 400 });
  }

  const db = getDb();
  const categoryRows = await db
    .select()
    .from(wallCategories)
    .where(eq(wallCategories.id, validated.value.categoryId))
    .limit(1);
  const category = categoryRows[0];
  if (!category || category.status !== "active") {
    return privateJson(
      { error: "Essa categoria não aceita novas publicações." },
      { status: 400 },
    );
  }

  const contentHash = await wallContentHash(
    validated.value.title,
    validated.value.body,
  );
  const duplicate = await db
    .select({ id: wallTopics.id })
    .from(wallTopics)
    .where(
      and(
        eq(wallTopics.contentHash, contentHash),
        gt(
          wallTopics.createdAt,
          new Date(Date.now() - 24 * 60 * 60_000).toISOString(),
        ),
      ),
    )
    .limit(1);
  if (duplicate[0]) {
    return privateJson(
      { error: "Uma publicação igual já foi enviada recentemente." },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();
  const status = statusForRisk(validated.risk);
  const topic = {
    id: crypto.randomUUID(),
    categoryId: category.id,
    displayName: validated.value.displayName,
    title: validated.value.title,
    body: validated.value.body,
    status,
    isOfficial: false,
    identityHash: prepared.identityHash,
    contentHash,
    replyCount: 0,
    closedAt: null,
    pinnedAt: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  } as const;
  await db.insert(wallTopics).values(topic);

  if (status !== "published") {
    return privateJson(
      {
        accepted: true,
        status: "pending",
        message: "Publicação recebida para análise.",
      },
      { status: 202 },
    );
  }
  return privateJson(
    {
      topic: toPublicWallTopic({
        ...topic,
        categoryName: category.name,
        categoryDescription: category.description,
        categoryStatus: category.status,
      }),
    },
    { status: 201 },
  );
}

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 100
    ? parsed
    : fallback;
}

function cleanFilter(value: string | null, max: number) {
  return (value ?? "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}
