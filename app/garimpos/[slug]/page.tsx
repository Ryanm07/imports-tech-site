import { permanentRedirect } from "next/navigation";

export default async function FindRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const safeSlug = /^[a-z0-9-]{3,100}$/u.test(slug) ? slug : "projetos-grid";
  permanentRedirect(`/projetos#${safeSlug}`);
}
