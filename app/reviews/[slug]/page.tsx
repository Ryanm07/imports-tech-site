import { redirect } from "next/navigation";

export default async function ReviewRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await params;
  redirect("/sobre");
}
