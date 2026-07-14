import { getYouTubeData } from "@/lib/youtube-service";

export async function GET() {
  const data = await getYouTubeData();
  return Response.json(data, {
    headers: {
      "Cache-Control":
        "public, max-age=60, s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
