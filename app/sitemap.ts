import type { MetadataRoute } from "next";
import { finds, reviews } from "@/lib/site-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL || "https://central-do-canal-2026.vsvsbssy.chatgpt.site";
  const routes = ["", "/videos", "/reviews", "/garimpos", "/metricas", "/comunidade", "/sobre", "/privacidade", "/termos", "/afiliados", "/contato"];
  return [
    ...routes.map((route) => ({ url: `${base}${route}`, lastModified: new Date() })),
    ...reviews.map((review) => ({ url: `${base}/reviews/${review.slug}`, lastModified: new Date(review.updatedAt) })),
    ...finds.map((find) => ({ url: `${base}/garimpos/${find.slug}`, lastModified: new Date() })),
  ];
}
