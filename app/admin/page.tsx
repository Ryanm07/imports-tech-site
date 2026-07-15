import type { Metadata } from "next";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { AdminPanel } from "@/components/admin-panel";
import { authorizeOwnerUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Painel do proprietário",
  description: "Área privada do proprietário do Imports Tech.",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (process.env.ADMIN_ENABLED !== "true") {
    return (
      <main id="conteudo" className="page-main">
        <div className="feature-soon">
          <span>ÁREA PRIVADA</span>
          <h1>Painel administrativo desativado.</h1>
          <p>
            A interface permanece indisponível até a ativação explícita da
            feature flag e a configuração segura do proprietário.
          </p>
        </div>
      </main>
    );
  }

  const user = await requireChatGPTUser("/admin");
  const owner = await authorizeOwnerUser(user).catch(() => null);
  if (!owner) {
    return (
      <main id="conteudo" className="page-main">
        <div className="feature-soon">
          <span>ACESSO NEGADO</span>
          <h1>Você não tem permissão.</h1>
          <p>A autorização do proprietário foi validada no servidor.</p>
        </div>
      </main>
    );
  }

  return (
    <main id="conteudo" className="page-main">
      <header className="page-hero">
        <span className="eyebrow-v2">PAINEL DO PROPRIETÁRIO</span>
        <h1>Conteúdo, história e métricas.</h1>
        <p>
          Eu reviso textos, projetos, links e marcos antes de publicar. O painel
          também mostra somente o estado sanitizado da sincronização do YouTube.
        </p>
      </header>
      <AdminPanel />
    </main>
  );
}
