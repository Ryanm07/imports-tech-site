import { redirect } from "next/navigation";
import { BRAND_LINKS } from "@/lib/brand";

export default function VideosRedirect() {
  redirect(BRAND_LINKS.youtube);
}
