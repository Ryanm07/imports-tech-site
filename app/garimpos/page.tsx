import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedFinds } from "@/lib/content-repository";
import { money } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Garimpos",
  description:
    "Histórias completas de compras usadas, diagnóstico, reparo e resultado.",
  alternates: { canonical: "/garimpos" },
};

export default async function FindsPage() {
  const finds = await getPublishedFinds();
  return (
    <main id="conteudo" className="page-main">
      <header className="page-hero">
        <span className="eyebrow-v2">GARIMPOS E REPAROS</span>
        <h1>Do anúncio ao resultado.</h1>
        <p>Preço, risco, defeito, custo e situação atual.</p>
      </header>
      <div className="finds-library">
        {finds.map((find, index) => (
          <Link
            className="find-card"
            href={`/garimpos/${find.slug}`}
            key={find.slug}
          >
            <span className="find-index">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <span className="content-tag">{find.currentStatus}</span>
              <h2>{find.product}</h2>
              <p>{find.announcedProblem}</p>
            </div>
            <dl>
              <div>
                <dt>Preço pago</dt>
                <dd>{money(find.negotiatedPrice)}</dd>
              </div>
              <div>
                <dt>Custo total</dt>
                <dd>{money(find.totalCost)}</dd>
              </div>
            </dl>
            <i>Ver linha do tempo →</i>
          </Link>
        ))}
      </div>
    </main>
  );
}
