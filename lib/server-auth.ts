import { eq } from "drizzle-orm";
import { getChatGPTUser, type ChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { canModerate, type ProfileRole } from "@/lib/community-domain";
import { privateJson } from "@/lib/http";
import { getAdminCount, getOrCreateProfile } from "@/lib/profiles";

type ApiUserAuthorization =
  | { kind: "authorized"; user: ChatGPTUser }
  | { kind: "error"; error: Response };

type StaffAuthorization =
  | {
      kind: "authorized";
      user: ChatGPTUser;
      profile: NonNullable<Awaited<ReturnType<typeof authorizeStaffUser>>>;
    }
  | { kind: "error"; error: Response };

export async function requireApiUser(): Promise<ApiUserAuthorization> {
  const user = await getChatGPTUser();
  if (!user) {
    return {
      kind: "error",
      error: privateJson(
        { error: "Autenticação necessária." },
        { status: 401 },
      ),
    };
  }
  return { kind: "authorized", user };
}

export async function authorizeStaffUser(user: ChatGPTUser) {
  const db = getDb();
  const email = user.email.trim().toLowerCase();
  let rows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.email, email))
    .limit(1);

  if (!rows[0]) {
    const allowlist = getBootstrapAllowlist();
    const mayBootstrap = allowlist.has(email) && (await getAdminCount()) === 0;
    await getOrCreateProfile(user, mayBootstrap ? "admin" : "user");
    rows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);
  } else if (
    rows[0].role === "user" &&
    getBootstrapAllowlist().has(email) &&
    (await getAdminCount()) === 0
  ) {
    rows = await db
      .update(profiles)
      .set({ role: "admin", updatedAt: new Date().toISOString() })
      .where(eq(profiles.id, rows[0].id))
      .returning();
  }

  const profile = rows[0];
  if (!profile || profile.status !== "active" || !canModerate(profile.role)) {
    return null;
  }
  return profile;
}

export async function requireStaffApi(
  requiredRole: "moderator" | "admin" = "moderator",
): Promise<StaffAuthorization> {
  const auth = await requireApiUser();
  if (auth.kind === "error") return auth;
  try {
    const profile = await authorizeStaffUser(auth.user);
    const permitted =
      profile &&
      (requiredRole === "moderator" ||
        profile.role === ("admin" satisfies ProfileRole));
    if (!permitted) {
      return {
        kind: "error",
        error: privateJson(
          { error: "Permissão administrativa necessária." },
          { status: 403 },
        ),
      };
    }
    return { kind: "authorized", user: auth.user, profile };
  } catch {
    return {
      kind: "error",
      error: privateJson(
        { error: "Não foi possível validar a permissão." },
        { status: 503 },
      ),
    };
  }
}

export function requireAdminApi() {
  return requireStaffApi("admin");
}

function getBootstrapAllowlist() {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}
