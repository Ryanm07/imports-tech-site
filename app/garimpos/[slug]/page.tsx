import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPublishedFinds } from "@/lib/content-repository";
import { safeJsonLd } from "@/lib/json-ld";
import { getSiteUrl } from "@/lib/site-url";
import { money } from "@/lib/site-data";

type Context = { params: Promise<{ slug: string }> };

const legacySlugs: Record<string, string> = {
  "iphone-12-por-650": "iphone-12-por-658-36",
  "galaxy-s21-ultra-olx-502": "galaxy-s21-ultra-olx-502-89",
  "notebook-gamer-por-1200": "acer-nitro-5-an515-54",
};

export async function generateMetadata({ params }: Context): Promise<Metadata> {
  const { slug } = await params;
  const canonicalSlug = legacySlugs[slug] || slug;
  const find = (await getPublishedFinds()).find(
    (item) => item.slug === canonicalSlug,
  );
  return find
    ? {
        title: find.product,
        description: find.announcedProblem,
        alternates: { canonical: `/garimpos/${canonicalSlug}` },
      }
    : { title: "Garimpo não encontrado" };
}

export default async function FindPage({ params }: Context) {
  const { slug } = await params;
  if (legacySlugs[slug]) redirect(`/garimpos/${legacySlugs[slug]}`);
  const find = (await getPublishedFinds()).find((item) => item.slug === slug);
  if (!find) notFound();
  const site = getSiteUrl();
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Início",
        item: site.toString(),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Garimpos",
        item: new URL("/garimpos", site).toString(),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: find.product,
        item: new URL(`/garimpos/${find.slug}`, site).toString(),
      },
    ],
  };
  return (
    <main id="conteudo" className="page-main detail-page">
      <nav className="breadcrumbs" aria-label="Navegação estrutural">
        <Link href="/">Início</Link>
        <span aria-hidden="true">/</span>
        <Link href="/garimpos">Garimpos</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{find.product}</span>
      </nav>
      <header className="detail-hero">
        <div>
          <span className="content-tag">GARIMPO IMPORTS TECH</span>
          <h1>{find.product}</h1>
          <p>{find.announcedProblem}</p>
        </div>
        <div className="price-stamp">
          <span>Preço negociado</span>
          <strong>{money(find.negotiatedPrice)}</strong>
        </div>
      </header>
      <section className="timeline-section">
        <div>
          <span className="eyebrow-v2">LINHA DO TEMPO</span>
          <h2>A história sem atalhos</h2>
        </div>
        <ol className="timeline">
          {find.timeline.map((event, index) => (
            <li className={event.state} key={event.label}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{event.label}</strong>
                <p>{event.detail}</p>
              </div>
              <i>{event.state === "done" ? "Concluído" : "Pendente"}</i>
            </li>
          ))}
        </ol>
      </section>
      <section className="detail-facts">
        <div>
          <span>Preço negociado</span>
          <strong>{money(find.negotiatedPrice)}</strong>
        </div>
        <div>
          <span>Reparo confirmado</span>
          <strong>{money(find.repairCost)}</strong>
        </div>
        <div>
          <span>Custo total</span>
          <strong>{money(find.totalCost)}</strong>
        </div>
        <div>
          <span>Situação atual</span>
          <strong>{find.currentStatus}</strong>
        </div>
      </section>
      {(find.salePrice !== null || find.reimbursement !== null) && (
        <section className="detail-facts">
          <div>
            <span>Valor de venda</span>
            <strong>{money(find.salePrice)}</strong>
          </div>
          <div>
            <span>Reembolso posterior</span>
            <strong>{money(find.reimbursement)}</strong>
          </div>
        </section>
      )}
      <section className="current-status">
        <span>Resultado</span>
        <h2>{find.result}</h2>
        <p>Última atualização editorial: {formatDate(find.updatedAt)}.</p>
        <Link className="button primary" href={`/videos/${find.videoId}`}>
          ▶ Abrir vídeo relacionado
        </Link>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
      />
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}
