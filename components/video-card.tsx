import Image from "next/image";
import { ArrowIcon, PlayIcon } from "@/components/ui-icons";
import type { FeaturedContent } from "@/lib/featured-content";

export function VideoCard({ video }: { video: FeaturedContent }) {
  return (
    <article className="video-card" data-reveal>
      <a
        href={video.url}
        target="_blank"
        rel="noreferrer"
        aria-label={`Assistir no YouTube: ${video.title}`}
      >
        <div className="video-thumbnail">
          <Image
            src={video.thumbnail}
            alt={video.title}
            width={480}
            height={360}
            sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw"
            unoptimized
          />
          <span className="video-play">
            <PlayIcon />
          </span>
          <span className="video-watch">Assistir no YouTube</span>
        </div>
        <div className="video-meta">
          <span>{video.kind}</span>
          <span>{video.category}</span>
        </div>
        <div className="video-title">
          <h3>{video.title}</h3>
          <ArrowIcon />
        </div>
        <p>{video.summary}</p>
      </a>
    </article>
  );
}
