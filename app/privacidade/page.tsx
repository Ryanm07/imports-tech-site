import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como o site Imports Tech trata dados e solicitações de privacidade.",
  alternates: { canonical: "/privacidade" },
};

export default function PrivacyPage() {
  return (
    <main id="conteudo" className="page-main legal-page">
      <span className="eyebrow-v2">TRANSPARÊNCIA</span>
      <h1>Política de Privacidade</h1>
      <p>
        A navegação pública não exige conta. Para dúvidas, acesso, correção,
        oposição ou exclusão, use a{" "}
        <Link href="/contato">página de contato</Link>.
      </p>

      <h2>Navegação pública</h2>
      <p>
        O site não mantém fórum, contas públicas, comentários próprios ou
        formulários de publicação. Os links para Telegram e YouTube levam a
        serviços externos, sujeitos às políticas de cada plataforma.
      </p>

      <h2>Infraestrutura</h2>
      <p>
        O site usa infraestrutura Cloudflare para hospedagem e banco editorial,
        além da API oficial do YouTube para sincronizar métricas públicas. Eu
        não instalo analytics ou cookies próprios de publicidade nesta versão.
      </p>

      <h2>Painel privado e conteúdo editorial</h2>
      <p>
        O painel é exclusivo do proprietário configurado no servidor. A
        autenticação da hospedagem fornece a identidade necessária para
        autorizar esse acesso; ela não cria contas públicas no site. Conteúdo
        editorial, estado de sincronização do YouTube e ações administrativas
        são armazenados no Cloudflare D1 quando os recursos correspondentes
        estão ativos.
      </p>

      <h2>Infraestrutura e compartilhamento</h2>
      <p>
        O Imports Tech não vende dados pessoais. Transferências internacionais
        podem ocorrer conforme a operação desses fornecedores.
      </p>

      <h2>Seus direitos</h2>
      <p>
        Você pode solicitar confirmação de tratamento, acesso, correção,
        informação sobre compartilhamento, oposição e exclusão quando aplicável.
        Pode ser necessário fornecer elementos suficientes para localizar a
        solicitação.
      </p>

      <p className="legal-date">Última atualização: 14 de julho de 2026.</p>
    </main>
  );
}
