import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPublishedFinds,
  getPublishedReviews,
} from "@/lib/content-repository";
import { safeJsonLd } from "@/lib/json-ld";
import { getSiteUrl } from "@/lib/site-url";
import { getYouTubeData } from "@/lib/youtube-service";

type Context = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Context): Promise<Metadata> {
  const { id } = await params;
  if (!isVideoId(id)) return { title: "Vídeo não encontrado" };
  const data = await getYouTubeData();
  const video = data.videos.find((item) => item.id === id);
  if (!video) return { title: "Vídeo não encontrado" };
  return {
    title: video.title,
    description: summaryFor(video.description, video.title),
    alternates: { canonical: `/videos/${video.id}` },
    openGraph: {
      type: "video.other",
      title: video.title,
      description: summaryFor(video.description, video.title),
      images: [{ url: video.thumbnail }],
    },
  };
}

export default async function VideoPage({ params }: Context) {
  const { id } = await params;
  if (!isVideoId(id)) notFound();
  const [data, reviews, finds] = await Promise.all([
    getYouTubeData(),
    getPublishedReviews(),
    getPublishedFinds(),
  ]);
  const video = data.videos.find((item) => item.id === id);
  if (!video) notFound();

  const relatedIds = relationGroup(video.id);
  const relatedReviews = reviews.filter((item) => relatedIds.has(item.videoId));
  const relatedFinds = finds.filter((item) => relatedIds.has(item.videoId));
  const site = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: summaryFor(video.description, video.title),
    thumbnailUrl: [video.thumbnail],
    uploadDate: video.publishedAt,
    duration: displayDurationToIso(video.duration),
    contentUrl: `https://www.youtube.com/watch?v=${video.id}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${video.id}`,
    url: new URL(`/videos/${video.id}`, site).toString(),
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: { "@type": "WatchAction" },
      userInteractionCount: video.views,
    },
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
        name: "Vídeos",
        item: new URL("/videos", site).toString(),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: video.title,
        item: new URL(`/videos/${video.id}`, site).toString(),
      },
    ],
  };

  return (
    <main id="conteudo" className="page-main detail-page video-detail-page">
      <nav className="breadcrumbs" aria-label="Navegação estrutural">
        <Link href="/">Início</Link>
        <span aria-hidden="true">/</span>
        <Link href="/videos">Vídeos</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{video.title}</span>
      </nav>

      <header className="video-detail-hero">
        <div className="video-detail-copy">
          <span className="content-tag">{video.category}</span>
          <h1>{video.title}</h1>
          <p>{summaryFor(video.description, video.title)}</p>
          <div className="video-detail-meta">
            <span>{formatDate(video.publishedAt)}</span>
            <span>{video.duration || "Duração não informada"}</span>
            <span>{formatViews(video.views)} visualizações</span>
          </div>
          <div className="category-pills" aria-label="Tags do vídeo">
            {video.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
        <div className="video-detail-image">
          <Image
            src={video.thumbnail}
            alt={`Thumbnail do vídeo ${video.title}`}
            fill
            priority
            sizes="(max-width: 760px) 100vw, 52vw"
          />
        </div>
      </header>

      <section className="video-player-shell" aria-label="Reprodução do vídeo">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.id}`}
          title={video.title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
        <a
          className="button secondary"
          href={`https://www.youtube.com/watch?v=${video.id}`}
          target="_blank"
          rel="noreferrer"
        >
          Abrir no YouTube ↗
        </a>
      </section>

      {(relatedReviews.length > 0 || relatedFinds.length > 0) && (
        <section className="related-editorial">
          <span className="eyebrow-v2">CONTEÚDO RELACIONADO</span>
          <h2>Continue a história.</h2>
          <div className="related-editorial-grid">
            {relatedReviews.map((review) => (
              <Link key={review.slug} href={`/reviews/${review.slug}`}>
                <span>Review</span>
                <strong>{review.name}</strong>
                <p>{review.summary}</p>
              </Link>
            ))}
            {relatedFinds.map((find) => (
              <Link key={find.slug} href={`/garimpos/${find.slug}`}>
                <span>Garimpo</span>
                <strong>{find.product}</strong>
                <p>{find.result}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
      />
    </main>
  );
}

function isVideoId(value: string) {
  return /^[\w-]{11}$/.test(value);
}

function summaryFor(description: string, fallback: string) {
  const value = (description || fallback).replace(/\s+/g, " ").trim();
  return value.slice(0, 320);
}

function relationGroup(id: string) {
  const groups = [
    ["fnD2R4YoJ8k", "i4LXDsWlc8Q"],
    ["biatbb6rvwU", "ScBB5TZ-Py8"],
    ["cbodYFxeINo"],
    ["Y1nStLptXY0", "4gf5vtyihyU"],
  ];
  return new Set(groups.find((group) => group.includes(id)) || [id]);
}

function displayDurationToIso(value: string) {
  const parts = value.split(":").map(Number);
  if (parts.some(Number.isNaN)) return undefined;
  if (parts.length === 2) return `PT${parts[0]}M${parts[1]}S`;
  if (parts.length === 3) return `PT${parts[0]}H${parts[1]}M${parts[2]}S`;
  return undefined;
}

function formatViews(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Data não informada"
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(date);
}
