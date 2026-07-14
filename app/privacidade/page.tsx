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

      <h2>Dados do Mural da Comunidade</h2>
      <p>
        Quando o Mural for ativado, o visitante poderá informar um nome de
        exibição e enviar categoria, título, mensagem, respostas e denúncias. O
        site não solicita nem armazena e-mail do visitante para essa finalidade.
        O nome informado não é uma identidade verificada.
      </p>

      <h2>Prevenção de abuso</h2>
      <p>
        Para aplicar limites, combater spam e permitir bloqueios temporários, o
        endereço de origem recebido da infraestrutura é combinado com um segredo
        privado e transformado em hash antes da persistência. O endereço em
        texto simples não é gravado nas tabelas do Mural. Tentativas, inclusive
        inválidas, podem consumir limites temporários. O Cloudflare Turnstile é
        usado para verificação anti-spam e está sujeito às práticas da
        Cloudflare.
      </p>

      <h2>Moderação e retenção</h2>
      <p>
        Publicações normais podem aparecer automaticamente; conteúdo suspeito
        pode aguardar análise ou ser classificado como spam. Publicações,
        respostas, denúncias, hashes bloqueados e histórico de moderação podem
        ser mantidos pelo período necessário à segurança, à integridade das
        conversas e ao cumprimento de obrigações aplicáveis. A remoção lógica
        preserva o histórico; a exclusão definitiva é uma ação reforçada do
        proprietário.
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
        O site usa infraestrutura Cloudflare para hospedagem, banco e proteção
        contra abuso, e a API oficial do YouTube para sincronizar dados públicos
        do canal. O Imports Tech não vende dados pessoais e não instala
        analytics ou cookies próprios de publicidade nesta versão.
        Transferências internacionais podem ocorrer conforme a operação desses
        fornecedores.
      </p>

      <h2>Seus direitos</h2>
      <p>
        Você pode solicitar confirmação de tratamento, acesso, correção,
        informação sobre compartilhamento, oposição e exclusão quando aplicável.
        Pode ser necessário indicar o conteúdo e fornecer elementos suficientes
        para localizar a solicitação, pois o Mural não mantém conta ou e-mail do
        visitante.
      </p>

      <p className="legal-date">Última atualização: 14 de julho de 2026.</p>
    </main>
  );
}
