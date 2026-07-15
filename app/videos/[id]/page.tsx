import { redirect } from "next/navigation";
import { BRAND_LINKS } from "@/lib/brand";

export default async function VideoRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{11}$/u.test(id)) redirect("/");
  redirect(`${BRAND_LINKS.youtubeWatch}${encodeURIComponent(id)}`);
}
