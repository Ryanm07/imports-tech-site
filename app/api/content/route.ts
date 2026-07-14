import { getPublicEditorialData } from "@/lib/content-repository";

export async function GET() {
  const data = await getPublicEditorialData();
  return Response.json(data, {
    headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
  });
}
