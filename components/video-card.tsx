import Image from "next/image";

export type VideoCardData = { id: string; title: string; views: number; publishedAt: string; duration: string; thumbnail?: string; category: string };

export function compact(value: number) {
  return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function shortDate(value: string) {
  if (!value) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function VideoCard({ video, featured = false }: { video: VideoCardData; featured?: boolean }) {
  return <a className={featured ? "video-card-v2 featured" : "video-card-v2"} href={`https://youtu.be/${video.id}`} target="_blank" rel="noreferrer">
    <div className="video-thumb"><Image src={video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt={`Thumbnail: ${video.title}`} fill sizes={featured ? "(max-width: 760px) 100vw, 48vw" : "(max-width: 760px) 100vw, 33vw"} priority={featured} unoptimized/><span className="play-button">▶</span><span className="video-duration">{video.duration || "Vídeo"}</span></div>
    <div className="video-copy"><span className="content-tag">{video.category}</span><h3>{video.title}</h3><p>{compact(video.views)} visualizações <i/> {shortDate(video.publishedAt)}</p></div>
  </a>;
}
