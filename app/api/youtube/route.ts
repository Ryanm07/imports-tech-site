import { getYouTubeMetrics } from "@/lib/youtube-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getYouTubeMetrics();
  return Response.json(data, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
