import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { wallCategories } from "@/db/schema";
import { privateJson } from "@/lib/http";
import { wallIsEnabled } from "@/lib/wall-request";

export async function GET() {
  if (!wallIsEnabled()) {
    return privateJson({ error: "Mural em breve." }, { status: 503 });
  }
  const categories = await getDb()
    .select({
      id: wallCategories.id,
      name: wallCategories.name,
      description: wallCategories.description,
      status: wallCategories.status,
    })
    .from(wallCategories)
    .orderBy(asc(wallCategories.position), asc(wallCategories.name));
  return privateJson({ categories });
}
