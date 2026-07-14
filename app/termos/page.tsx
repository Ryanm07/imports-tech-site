import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos do Mural da Comunidade",
  description: "Regras de convivência e moderação do Mural Imports Tech.",
  alternates: { canonical: "/termos" },
};

export default function TermsPage() {
  return (
    <main id="conteudo" className="page-main legal-page">
      <span className="eyebrow-v2">REGRAS DE CONVIVÊNCIA</span>
      <h1>Termos do Mural da Comunidade</h1>
      <p>
        Participe com respeito, contexto e boa-fé. Não publique dados pessoais,
        golpes, spam, assédio, discurso de ódio, conteúdo ilegal ou links
        maliciosos.
      </p>
      <h2>Nomes e autoria</h2>
      <p>
        Não há cadastro público. O nome é informado pelo visitante e não é
        verificado. Nomes que imitem o canal, o proprietário, administração,
        moderação ou suporte são reservados. Apenas “Ryan — Imports Tech” com o
        selo oficial representa uma publicação do canal.
      </p>
      <h2>Publicação e moderação</h2>
      <p>
        Conteúdo normal pode ser publicado automaticamente. Conteúdo suspeito
        pode ficar pendente, ser ocultado, removido ou marcado como spam.
        Conversas podem ser fixadas, movidas, encerradas ou reabertas. Origens
        associadas a abuso podem ser bloqueadas por hash durante período
        definido.
      </p>
      <h2>Denúncias e exclusão</h2>
      <p>
        Qualquer visitante pode denunciar conteúdo, sujeito à verificação
        anti-spam e aos limites. A remoção comum é lógica para preservar o
        histórico; a exclusão definitiva fica restrita ao proprietário e exige
        confirmação reforçada.
      </p>
      <h2>Disponibilidade</h2>
      <p>
        O Mural pode ser pausado para segurança, manutenção ou homologação. Não
        há garantia de publicação imediata ou permanência de conteúdo que viole
        estas regras.
      </p>
    </main>
  );
}
