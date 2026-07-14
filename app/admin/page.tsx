import type { Metadata } from "next";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { AdminPanel } from "@/components/admin-panel";
import { authorizeStaffUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Painel administrativo",
  description: "Área administrativa protegida do Imports Tech.",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (process.env.ADMIN_ENABLED !== "true") {
    return (
      <main id="conteudo" className="page-main">
        <div className="feature-soon">
          <span>ÁREA PROTEGIDA</span>
          <h1>Painel administrativo desativado.</h1>
          <p>
            A interface e as operações administrativas permanecem indisponíveis
            até a configuração explícita da feature flag e da primeira conta
            administrativa.
          </p>
        </div>
      </main>
    );
  }

  const user = await requireChatGPTUser("/admin");
  const profile = await authorizeStaffUser(user).catch(() => null);
  if (!profile) {
    return (
      <main id="conteudo" className="page-main">
        <div className="feature-soon">
          <span>ACESSO NEGADO</span>
          <h1>Você não tem permissão.</h1>
          <p>A autorização persistida foi validada no servidor.</p>
        </div>
      </main>
    );
  }

  return (
    <main id="conteudo" className="page-main">
      <header className="page-hero">
        <span className="eyebrow-v2">PAINEL ADMINISTRATIVO</span>
        <h1>Conteúdo e moderação.</h1>
        <p>
          Sessão ativa como {profile.displayName}. Todas as gravações passam por
          autorização persistida e auditoria.
        </p>
      </header>
      <AdminPanel
        currentRole={profile.role === "admin" ? "admin" : "moderator"}
      />
    </main>
  );
}
