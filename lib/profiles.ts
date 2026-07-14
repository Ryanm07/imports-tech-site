import { and, count, eq } from "drizzle-orm";
import type { ChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { resolveProfileState, type ProfileRole } from "@/lib/community-domain";

export type Profile = typeof profiles.$inferSelect;

export async function getOrCreateProfile(
  user: ChatGPTUser,
  requestedRole: ProfileRole = "user",
) {
  const db = getDb();
  const normalizedEmail = user.email.trim().toLowerCase();
  const existing = await db
    .select()
    .from(profiles)
    .where(eq(profiles.email, normalizedEmail))
    .limit(1);
  if (existing[0]) {
    if (
      existing[0].displayName !== user.displayName &&
      existing[0].status !== "deleted"
    ) {
      const updatedAt = new Date().toISOString();
      await db
        .update(profiles)
        .set({ displayName: user.displayName, updatedAt })
        .where(eq(profiles.id, existing[0].id));
      return { ...existing[0], displayName: user.displayName, updatedAt };
    }
    return existing[0];
  }

  const now = new Date().toISOString();
  const profile: typeof profiles.$inferInsert = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    displayName: user.displayName,
    role: requestedRole,
    status: "active",
    blockType: null,
    blockedUntil: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  await db.insert(profiles).values(profile);
  return profile as Profile;
}

export async function getWritableProfile(user: ChatGPTUser) {
  const db = getDb();
  const profile = await getOrCreateProfile(user);
  const state = resolveProfileState(profile);
  if (state.shouldActivate) {
    const updatedAt = new Date().toISOString();
    const rows = await db
      .update(profiles)
      .set({
        status: "active",
        blockType: null,
        blockedUntil: null,
        updatedAt,
      })
      .where(and(eq(profiles.id, profile.id), eq(profiles.status, "blocked")))
      .returning();
    if (rows[0]) return rows[0];
  }
  return state.allowed ? profile : null;
}

export async function getAdminCount() {
  const rows = await getDb()
    .select({ value: count() })
    .from(profiles)
    .where(and(eq(profiles.role, "admin"), eq(profiles.status, "active")));
  return rows[0]?.value ?? 0;
}
