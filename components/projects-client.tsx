"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { PublicProject } from "@/lib/projects";
import { money } from "@/lib/site-data";

export function ProjectsClient({ projects }: { projects: PublicProject[] }) {
  const filters = useMemo(
    () => [
      "Todos",
      ...new Set(
        projects.flatMap((project) => [project.kind, project.category]),
      ),
    ],
    [projects],
  );
  const [filter, setFilter] = useState("Todos");
  const visible = projects.filter(
    (project) =>
      filter === "Todos" ||
      project.kind === filter ||
      project.category === filter ||
      project.tags.includes(filter),
  );

  return (
    <>
      <div className="project-filters" aria-label="Filtrar projetos">
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={filter === item}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="projects-grid" id="projetos-grid" aria-live="polite">
        {visible.map((project) => (
          <article
            className="project-card"
            id={project.slug}
            key={project.slug}
          >
            <div className="project-image">
              <Image
                src={project.image}
                alt={`Imagem do projeto ${project.title}`}
                fill
                sizes="(max-width: 760px) 100vw, (max-width: 1120px) 50vw, 33vw"
              />
              <span>{project.kind}</span>
            </div>
            <div className="project-content">
              <small>{project.category}</small>
              <h2>{project.title}</h2>
              <p>{project.summary}</p>
              <dl>
                <div>
                  <dt>Valor pago</dt>
                  <dd>{money(project.pricePaid)}</dd>
                </div>
                <div>
                  <dt>Problema</dt>
                  <dd>{project.problem}</dd>
                </div>
                {project.repair && (
                  <div>
                    <dt>Reparo</dt>
                    <dd>{project.repair}</dd>
                  </div>
                )}
                <div>
                  <dt>Resultado</dt>
                  <dd>{project.result}</dd>
                </div>
              </dl>
              <div className="project-card-footer">
                <span>{project.currentStatus}</span>
                <a href={project.youtubeUrl} target="_blank" rel="noreferrer">
                  Assistir no YouTube ↗
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!visible.length && (
        <div className="empty-state" role="status">
          <strong>Nenhum projeto neste filtro.</strong>
        </div>
      )}
    </>
  );
}
