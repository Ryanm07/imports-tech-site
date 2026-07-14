import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como o site Imports Tech trata dados pessoais e solicitações de privacidade.",
  alternates: { canonical: "/privacidade" },
};

export default function PrivacyPage() {
  return (
    <main id="conteudo" className="page-main legal-page">
      <span className="eyebrow-v2">TRANSPARÊNCIA</span>
      <h1>Política de Privacidade</h1>
      <p>
        O Imports Tech é o controlador dos dados tratados diretamente neste
        site. Para dúvidas, correção, acesso, oposição ou exclusão, escreva para{" "}
        <a href="mailto:imports.tech.contact@gmail.com">
          imports.tech.contact@gmail.com
        </a>
        .
      </p>

      <h2>Dados coletados e finalidade</h2>
      <p>
        A navegação pública não exige cadastro e o site não instala cookies de
        publicidade ou analytics próprios. Registros técnicos mínimos podem ser
        processados pela hospedagem para entregar páginas, prevenir abuso e
        manter a segurança. Quando a comunidade for ativada, serão tratados
        e-mail e nome fornecidos pela autenticação, um identificador público
        aleatório, papel, estado da conta, publicações, respostas, denúncias e
        registros de moderação. O e-mail permanece privado e não integra as
        respostas públicas.
      </p>

      <h2>Finalidades e bases</h2>
      <p>
        Os dados da comunidade serão usados para autenticar participantes,
        exibir autoria pública, permitir edição, combater spam, receber
        denúncias e aplicar as regras. Conforme o caso, o tratamento se apoia na
        execução do serviço solicitado, no interesse legítimo de manter o
        ambiente seguro e no cumprimento de obrigações legais aplicáveis.
        Solicitações específicas poderão exigir confirmação de identidade.
      </p>

      <h2>Autenticação, banco e hospedagem</h2>
      <p>
        A autenticação é fornecida pela plataforma de hospedagem. Os dados
        persistentes da comunidade e do painel são armazenados no Cloudflare D1,
        e o site é executado em infraestrutura Cloudflare. Esses fornecedores
        atuam segundo seus próprios termos e podem processar dados em outros
        países; por isso, transferências internacionais podem ocorrer quando
        necessárias à operação da infraestrutura.
      </p>

      <h2>Compartilhamento e segurança</h2>
      <p>
        O Imports Tech não vende dados pessoais. Informações são compartilhadas
        apenas com fornecedores indispensáveis à autenticação, hospedagem e
        segurança, ou quando houver obrigação legal. O site aplica controle de
        acesso por papéis, respostas privadas sem cache, limitação de
        requisições, registro de ações administrativas e separação entre
        identidade privada e perfil público. Nenhum sistema elimina todos os
        riscos, mas as medidas são revistas antes da ativação dos recursos beta.
      </p>

      <h2>Retenção</h2>
      <p>
        Conteúdo publicado permanece enquanto a conta estiver ativa ou enquanto
        for necessário para a comunidade. Buckets de limitação expiram e são
        eliminados rotineiramente. Ao anonimizar uma conta, o e-mail é
        substituído por um identificador aleatório e o nome público vira “Conta
        removida”. Conteúdo e histórico de moderação podem ser preservados sem o
        e-mail para manter a integridade das conversas, prevenir abuso e
        documentar decisões.
      </p>

      <h2>Seus direitos e exclusão</h2>
      <p>
        Você pode solicitar confirmação de tratamento, acesso, correção,
        portabilidade quando aplicável, informação sobre compartilhamento,
        oposição e exclusão. Quando a comunidade estiver ativa, a própria área
        da conta oferecerá anonimização. A remoção de um administrador exige
        antes a transferência do papel para evitar a perda de controle do
        serviço. Também é possível usar a{" "}
        <Link href="/contato">página de contato</Link>.
      </p>

      <p className="legal-date">Última atualização: 14 de julho de 2026.</p>
    </main>
  );
}
