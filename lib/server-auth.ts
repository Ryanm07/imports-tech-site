import { eq } from "drizzle-orm";
import { getChatGPTUser, type ChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { ownerAccounts } from "@/db/schema";
import { privateJson } from "@/lib/http";
import { isConfiguredOwnerEmail, PUBLIC_OWNER } from "@/lib/owner-domain";

export type OwnerAccount = typeof ownerAccounts.$inferSelect;

type OwnerAuthorization =
  | { kind: "authorized"; user: ChatGPTUser; owner: OwnerAccount }
  | { kind: "error"; error: Response };

export async function authorizeOwnerUser(user: ChatGPTUser) {
  const email = user.email.trim().toLowerCase();
  if (!isConfiguredOwnerEmail(email)) return null;

  const db = getDb();
  const existing = await db
    .select()
    .from(ownerAccounts)
    .where(eq(ownerAccounts.email, email))
    .limit(1);
  const now = new Date().toISOString();
  if (existing[0]) {
    const rows = await db
      .update(ownerAccounts)
      .set({
        displayName: user.displayName || PUBLIC_OWNER.displayName,
        protected: true,
        updatedAt: now,
      })
      .where(eq(ownerAccounts.id, existing[0].id))
      .returning();
    return rows[0] || { ...existing[0], protected: true, updatedAt: now };
  }

  const owner: typeof ownerAccounts.$inferInsert = {
    id: crypto.randomUUID(),
    email,
    displayName: user.displayName || PUBLIC_OWNER.displayName,
    protected: true,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(ownerAccounts).values(owner);
  return owner as OwnerAccount;
}

export async function requireOwnerApi(): Promise<OwnerAuthorization> {
  const user = await getChatGPTUser();
  if (!user) {
    return {
      kind: "error",
      error: privateJson(
        { error: "Acesso privado necessário." },
        { status: 401 },
      ),
    };
  }
  try {
    const owner = await authorizeOwnerUser(user);
    if (!owner) {
      return {
        kind: "error",
        error: privateJson(
          { error: "Acesso não autorizado." },
          { status: 403 },
        ),
      };
    }
    return { kind: "authorized", user, owner };
  } catch {
    return {
      kind: "error",
      error: privateJson(
        { error: "Não foi possível validar o acesso privado." },
        { status: 503 },
      ),
    };
  }
}
