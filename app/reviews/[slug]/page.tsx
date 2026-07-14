import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPublishedReviews } from "@/lib/content-repository";
import { safeJsonLd } from "@/lib/json-ld";
import { getSiteUrl } from "@/lib/site-url";
import { money } from "@/lib/site-data";

type Context = { params: Promise<{ slug: string }> };

const legacySlugs: Record<string, string> = {
  "macbook-mais-vendido-do-brasil": "macbook-air-m1-usado",
};

export async function generateMetadata({ params }: Context): Promise<Metadata> {
  const { slug } = await params;
  const canonicalSlug = legacySlugs[slug] || slug;
  const review = (await getPublishedReviews()).find(
    (item) => item.slug === canonicalSlug,
  );
  return review
    ? {
        title: review.name,
        description: review.summary,
        alternates: { canonical: `/reviews/${canonicalSlug}` },
      }
    : { title: "Review não encontrada" };
}

export default async function ReviewPage({ params }: Context) {
  const { slug } = await params;
  if (legacySlugs[slug]) redirect(`/reviews/${legacySlugs[slug]}`);
  const review = (await getPublishedReviews()).find(
    (item) => item.slug === slug,
  );
  if (!review) notFound();

  const site = getSiteUrl();
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: review.name,
    description: review.summary,
    datePublished: review.testedAt,
    dateModified: review.updatedAt,
    author: { "@type": "Organization", name: "Imports Tech" },
    about: {
      "@type": "Product",
      name: review.name,
      brand: review.manufacturer,
    },
    mainEntityOfPage: new URL(`/reviews/${review.slug}`, site).toString(),
  };
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
        name: "Reviews",
        item: new URL("/reviews", site).toString(),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: review.name,
        item: new URL(`/reviews/${review.slug}`, site).toString(),
      },
    ],
  };

  return (
    <main id="conteudo" className="page-main detail-page">
      <nav className="breadcrumbs" aria-label="Navegação estrutural">
        <Link href="/">Início</Link>
        <span aria-hidden="true">/</span>
        <Link href="/reviews">Reviews</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{review.name}</span>
      </nav>
      <header className="detail-hero">
        <div>
          <span className="content-tag">
            {review.manufacturer} · {review.category}
          </span>
          <h1>{review.name}</h1>
          <p>{review.summary}</p>
        </div>
        <span className="verdict large conditional">
          {review.verdict || "Sem veredito publicado"}
        </span>
      </header>
      <section className="detail-facts">
        <div>
          <span>Testado em</span>
          <strong>{formatDate(review.testedAt)}</strong>
        </div>
        <div>
          <span>Preço pago</span>
          <strong>{money(review.pricePaid)}</strong>
        </div>
        <div>
          <span>Custo de reparo</span>
          <strong>{money(review.repairCost)}</strong>
        </div>
        <div>
          <span>Custo total conhecido</span>
          <strong>{money(review.totalCost)}</strong>
        </div>
      </section>
      {review.facts.length > 0 && (
        <section className="editorial-facts">
          <span className="eyebrow-v2">DADOS CONFIRMADOS</span>
          <ul>
            {review.facts.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}
      <section className="pros-cons">
        <div>
          <span className="eyebrow-v2">PONTOS POSITIVOS</span>
          <ul>
            {review.positives.map((item) => (
              <li key={item}>+ {item}</li>
            ))}
          </ul>
        </div>
        <div>
          <span className="eyebrow-v2">PONTOS DE ATENÇÃO</span>
          <ul>
            {review.negatives.map((item) => (
              <li key={item}>− {item}</li>
            ))}
          </ul>
        </div>
      </section>
      <section className="scores-section">
        <div>
          <span className="eyebrow-v2">NOTAS DO TESTE</span>
          <h2>
            {review.scores
              ? "Desempenho por categoria"
              : "Notas não publicadas"}
          </h2>
          <p>
            {review.scores
              ? "Notas aprovadas na avaliação editorial do canal."
              : "As notas numéricas não foram aprovadas editorialmente e não serão estimadas."}
          </p>
        </div>
        {review.scores && (
          <div className="score-grid">
            {Object.entries(review.scores).map(([key, value]) => (
              <div key={key}>
                <span>{key}</span>
                <strong>{value}/10</strong>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="current-status">
        <span>O que aconteceu depois?</span>
        <h2>{review.status}</h2>
        <p>Última atualização editorial: {formatDate(review.updatedAt)}.</p>
        <Link className="button primary" href={`/videos/${review.videoId}`}>
          ▶ Abrir vídeo relacionado
        </Link>
      </section>
      <div className="affiliate-note">
        Links de afiliado, quando existirem, serão identificados antes do
        clique.
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(articleLd) }}
      />
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
