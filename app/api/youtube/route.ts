import { getYouTubeMetrics } from "@/lib/youtube-service";

export async function GET() {
  const data = await getYouTubeMetrics();
  return Response.json(data, {
    headers: {
      "Cache-Control":
        "public, max-age=60, s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
