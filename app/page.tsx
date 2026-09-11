import type { Metadata } from "next";
import { StudioExperience } from "@/components/studio/studio-experience";
import { getSiteSettings } from "@/lib/content-repository";
import { getPublicLinks } from "@/lib/public-links";

export const metadata: Metadata = {
  title: "Estúdio Imports Tech — Entre e explore",
  description:
    "Entre no estúdio interativo do Imports Tech. Explore os equipamentos, descubra histórias e caminhe pelo espaço em 3D.",
  alternates: { canonical: "/" },
};

export default async function Home() {
  const { commercialEmail } = getPublicLinks(await getSiteSettings());
  return <StudioExperience commercialEmail={commercialEmail} />;
}
