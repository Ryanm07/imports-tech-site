import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso de afiliados",
  description: "Transparência sobre links de afiliado no Imports Tech.",
  alternates: { canonical: "/afiliados" },
};

export default function AffiliatePage() {
  return (
    <main id="conteudo" className="page-main legal-page">
      <span className="eyebrow-v2">TRANSPARÊNCIA COMERCIAL</span>
      <h1>Aviso de links de afiliado</h1>
      <p>
        Algumas páginas poderão conter links que geram comissão para o Imports
        Tech sem alterar o preço pago pelo visitante.
      </p>
      <p>
        Quando um link for afiliado, isso será indicado antes dele. A existência
        de comissão não muda o relato editorial ou a apresentação dos problemas.
      </p>
    </main>
  );
}
