import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommunityTopicClient } from "@/components/community-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Conversa do Mural",
  robots: { index: false, follow: true },
};

export default async function TopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (process.env.COMMUNITY_ENABLED !== "true") notFound();
  const { id } = await params;
  return (
    <main id="conteudo" className="page-main">
      <CommunityTopicClient
        id={id}
        turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
      />
    </main>
  );
}
