import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos da comunidade",
  description: "Regras de convivência e moderação da comunidade Imports Tech.",
  alternates: { canonical: "/termos" },
};

export default function TermsPage() {
  return (
    <main id="conteudo" className="page-main legal-page">
      <span className="eyebrow-v2">REGRAS DE CONVIVÊNCIA</span>
      <h1>Termos da comunidade</h1>
      <p>
        Participe com respeito, contexto e boa-fé. Não publique dados pessoais,
        golpes, spam, discurso de ódio, assédio ou links maliciosos.
      </p>
      <h2>Moderação</h2>
      <p>
        Conteúdo pode ser ocultado ou removido. Contas podem ser temporariamente
        bloqueadas ou banidas em casos graves ou reincidentes. Ações relevantes
        ficam registradas sem expor e-mail ao público.
      </p>
      <h2>Seu conteúdo</h2>
      <p>
        Você pode editar e excluir suas próprias publicações dentro das regras e
        limites técnicos informados. Exclusões usam remoção lógica quando o
        histórico de moderação precisa ser preservado.
      </p>
    </main>
  );
}
