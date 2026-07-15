import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProjectExperience } from "@/components/project-experience";
import { getPublicEditorialData } from "@/lib/content-repository";
import { buildProjects } from "@/lib/projects";
import { projectsEnabled } from "@/lib/features";

export const metadata: Metadata = {
  title: "Projetos",
  description:
    "Eu organizo os projetos mais marcantes do Imports Tech com compra, problema, custo, resultado e aprendizado.",
  alternates: { canonical: "/projetos" },
  robots: { index: false, follow: false },
};

export default async function ProjectsPage() {
  if (!projectsEnabled()) redirect("/sobre");
  const data = await getPublicEditorialData();
  const projects = buildProjects(
    data.reviews,
    data.finds,
    data.featuredProjectSlugs,
  );
  return (
    <main id="conteudo" className="page-main projects-page">
      <header className="page-hero" data-motion-section="abertura">
        <span className="eyebrow-v2">BASTIDORES E RESULTADOS</span>
        <h1>Eu não mostro só o produto. Eu conto o que aconteceu com ele.</h1>
        <p>
          Aqui estão os garimpos, reparos, reviews e periféricos que mais me
          ensinaram. Eu mostro quanto paguei, o problema que encontrei, o que
          decidi fazer e como a história terminou.
        </p>
      </header>
      <ProjectExperience projects={projects} />
    </main>
  );
}
