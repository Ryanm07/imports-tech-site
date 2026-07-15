import type { Metadata } from "next";
import { ProjectsClient } from "@/components/projects-client";
import { getPublicEditorialData } from "@/lib/content-repository";
import { buildProjects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Projetos",
  description:
    "Reviews, garimpos e reparos marcantes do Imports Tech, com contexto de compra, custo e resultado.",
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
        <h1>Projetos que contam uma história.</h1>
        <p>
          Reviews, garimpos e reparos reunidos pelo que realmente aconteceu:
          compra, problema, custo, decisão e resultado final.
        </p>
      </header>
      <ProjectsClient projects={projects} />
    </main>
  );
}
