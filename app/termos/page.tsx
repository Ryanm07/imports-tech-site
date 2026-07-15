import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos do site",
  description: "Condições de uso do site oficial Imports Tech.",
  alternates: { canonical: "/termos" },
};

export default function TermsPage() {
  return (
    <main id="conteudo" className="page-main legal-page">
      <span className="eyebrow-v2">TERMOS DO SITE</span>
      <h1>Informação com contexto e responsabilidade.</h1>
      <p>
        Eu publico relatos editoriais sobre compras, testes e reparos que vivi.
        Preços, condições e resultados pertencem ao contexto informado e podem
        não se repetir em outra compra.
      </p>
      <h2>Conteúdo e reparos</h2>
      <p>
        O conteúdo não substitui diagnóstico técnico profissional. Qualquer
        compra, abertura de aparelho ou reparo envolve riscos e deve respeitar a
        experiência, as ferramentas e a segurança de cada pessoa.
      </p>
      <h2>Comunidade externa</h2>
      <p>
        O site não mantém fórum, contas públicas ou publicações de visitantes.
        Telegram e YouTube são serviços externos, com termos e políticas
        próprios.
      </p>
      <h2>Correções</h2>
      <p>
        Quando eu confirmar que uma informação está errada ou desatualizada,
        posso corrigi-la mantendo o compromisso de não inventar fatos, datas ou
        números.
      </p>
    </main>
  );
}
