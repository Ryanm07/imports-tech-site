import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { rateLimits } from "@/db/schema";

export async function consumeRateLimit(identity: string, action: string, max: number, windowMinutes = 10) {
  const db = getDb();
  const bucket = Math.floor(Date.now() / (windowMinutes * 60_000));
  const key = `${identity}:${action}:${bucket}`;
  const now = new Date().toISOString();
  const current = await db.select().from(rateLimits).where(eq(rateLimits.key, key)).limit(1);
  if (current[0]?.count >= max) return false;
  if (current[0]) await db.update(rateLimits).set({ count: current[0].count + 1, updatedAt: now }).where(eq(rateLimits.key, key));
  else await db.insert(rateLimits).values({ key, count: 1, windowStart: new Date(bucket * windowMinutes * 60_000).toISOString(), updatedAt: now });
  return true;
}
