import { notFound } from "next/navigation";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { CommunityTopicClient } from "@/components/community-client";
export const dynamic = "force-dynamic";
export default async function TopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (process.env.COMMUNITY_ENABLED !== "true") notFound();
  const user = await requireChatGPTUser("/comunidade");
  const { id } = await params;
  return (
    <main id="conteudo" className="page-main">
      <CommunityTopicClient id={id} userName={user.displayName} />
    </main>
  );
}
