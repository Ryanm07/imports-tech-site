"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BRAND_ASSETS } from "@/lib/brand";

export type VideoCardData = {
  id: string;
  title: string;
  thumbnail?: string;
  duration?: string;
  category: string;
  views: number;
  publishedAt: string;
};

export function VideoCard({
  video,
  featured = false,
}: {
  video: VideoCardData;
  featured?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const thumbnail = imageFailed
    ? BRAND_ASSETS.logo
    : video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;

  return (
    <Link
      className={`video-card-v2${featured ? " featured" : ""}`}
      href={`/videos/${video.id}`}
    >
      <div className="video-thumb">
        <Image
          src={thumbnail}
          alt={`Thumbnail: ${video.title}`}
          fill
          sizes={
            featured
              ? "(max-width: 760px) 100vw, 48vw"
              : "(max-width: 760px) 100vw, 33vw"
          }
          priority={featured}
          onError={() => setImageFailed(true)}
        />
        <span className="play-button" aria-hidden="true">
          ▶
        </span>
        <span className="video-duration">{video.duration || "Vídeo"}</span>
      </div>
      <div className="video-copy">
        <span>{video.category}</span>
        <h3>{video.title}</h3>
        <p>
          {formatViews(video.views)} visualizações
          <i aria-hidden="true"> · </i>
          {formatDate(video.publishedAt)}
        </p>
      </div>
    </Link>
  );
}

function formatViews(value: number) {
  return new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Data não informada"
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
}
