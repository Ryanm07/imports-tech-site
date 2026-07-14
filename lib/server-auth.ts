import { getChatGPTUser } from "@/app/chatgpt-auth";

export async function requireApiUser() {
  const user = await getChatGPTUser();
  if (!user) return { error: Response.json({ error: "Autenticação necessária." }, { status: 401 }) } as const;
  return { user } as const;
}

export async function requireAdminApi() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth;
  const allowed = (process.env.ADMIN_EMAILS || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  if (!allowed.includes(auth.user.email.toLowerCase())) return { error: Response.json({ error: "Permissão administrativa necessária." }, { status: 403 }) } as const;
  return auth;
}
