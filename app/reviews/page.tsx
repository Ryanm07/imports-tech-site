import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedReviews } from "@/lib/content-repository";
import { money } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Reviews",
  description:
    "Análises do Imports Tech baseadas em uso real, preço pago e contexto de compra.",
  alternates: { canonical: "/reviews" },
};

export default async function ReviewsPage() {
  const reviews = await getPublishedReviews();
  return (
    <main id="conteudo" className="page-main">
      <header className="page-hero">
        <span className="eyebrow-v2">CENTRAL DE REVIEWS</span>
        <h1>O que aconteceu no uso real?</h1>
        <p>
          Experiência, preço pago, problemas encontrados e histórico posterior.
          Vereditos só aparecem quando forem aprovados editorialmente.
        </p>
      </header>
      <div className="review-grid review-library">
        {reviews.map((review) => (
          <Link
            className="review-card"
            href={`/reviews/${review.slug}`}
            key={review.slug}
          >
            <div className="review-top">
              <span className="content-tag">
                {review.manufacturer} · {review.category}
              </span>
              <span className="verdict conditional">
                {review.verdict || "Sem veredito publicado"}
              </span>
            </div>
            <h2>{review.name}</h2>
            <p>{review.summary}</p>
            <div className="review-meta">
              <span>
                Preço pago <strong>{money(review.pricePaid)}</strong>
              </span>
              <i>Ver review →</i>
            </div>
          </Link>
        ))}
      </div>
      <div className="editorial-note">
        <strong>Transparência editorial</strong>
        <p>
          Notas, custos e vereditos ainda não aprovados aparecem como não
          informados. O site não completa fichas com estimativas silenciosas.
        </p>
      </div>
    </main>
  );
}
