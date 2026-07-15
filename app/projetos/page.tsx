import type { Metadata } from "next";
import { ProjectsClient } from "@/components/projects-client";
import { getPublicEditorialData } from "@/lib/content-repository";
import { buildProjects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Projetos",
  description:
    "Eu organizo os projetos mais marcantes do Imports Tech com compra, problema, custo, resultado e aprendizado.",
  alternates: { canonical: "/projetos" },
};

export default async function ProjectsPage() {
  const data = await getPublicEditorialData();
  const projects = buildProjects(
    data.reviews,
    data.finds,
    data.featuredProjectSlugs,
  );
  return (
    <main id="conteudo" className="page-main projects-page">
      <header className="page-hero">
        <span className="eyebrow-v2">BASTIDORES E RESULTADOS</span>
        <h1>Eu não registro só o produto. Eu registro o que aconteceu.</h1>
        <p>
          Aqui eu reúno garimpos, reparos, reviews e periféricos pelo caminho
          completo: compra, problema, custo conhecido, decisão, resultado e o
          que aprendi.
        </p>
      </header>
      <ProjectsClient projects={projects} />
    </main>
  );
}
