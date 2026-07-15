"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicProject } from "@/lib/projects";
import { money } from "@/lib/site-data";

const filters = [
  "Todos",
  "Garimpos",
  "Reparos",
  "Reviews",
  "Periféricos",
] as const;

export function ProjectExperience({ projects }: { projects: PublicProject[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("Todos");
  const visible = useMemo(
    () =>
      projects.filter(
        (project) => filter === "Todos" || project.collection === filter,
      ),
    [filter, projects],
  );
  const [activeSlug, setActiveSlug] = useState(visible[0]?.slug || "");
  const articleRefs = useRef<Array<HTMLElement | null>>([]);
  const activeIndex = Math.max(
    0,
    visible.findIndex((project) => project.slug === activeSlug),
  );
  const active = visible[activeIndex] || visible[0];
  const next = visible[(activeIndex + 1) % Math.max(1, visible.length)];

  useEffect(() => {
    if (!visible.some((project) => project.slug === activeSlug)) {
      setActiveSlug(visible[0]?.slug || "");
    }
  }, [activeSlug, visible]);

  useEffect(() => {
    const elements = articleRefs.current.filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const slug = (visibleEntry?.target as HTMLElement | undefined)?.dataset
          .projectSlug;
        if (slug) setActiveSlug(slug);
      },
      { rootMargin: "-30% 0px -30%", threshold: [0.1, 0.45, 0.7] },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [visible]);

  return (
    <section className="project-experience" data-motion-section="projetos">
      <span className="section-signal-thread" aria-hidden="true" />
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

      {active ? (
        <div
          className="project-focus-layout"
          id="projetos-grid"
          aria-live="polite"
        >
          <aside className="project-focus-stage" aria-hidden="true">
            <div className="project-focus-image" key={active.slug}>
              <Image
                src={active.image}
                alt=""
                fill
                sizes="48vw"
                priority={activeIndex === 0}
              />
              <span>{active.collection}</span>
            </div>
            <div className="project-focus-copy">
              <small>
                {String(activeIndex + 1).padStart(2, "0")} /{" "}
                {String(visible.length).padStart(2, "0")}
              </small>
              <h2>{active.title}</h2>
              <p>{active.summary}</p>
            </div>
            {next && next.slug !== active.slug && (
              <div className="project-next-peek">
                <span>PRÓXIMO SINAL</span>
                <strong>{next.title}</strong>
              </div>
            )}
          </aside>

          <div className="project-focus-list">
            {visible.map((project, index) => (
              <article
                className={
                  project.slug === active?.slug
                    ? "project-focus-card is-active"
                    : "project-focus-card"
                }
                id={project.slug}
                key={project.slug}
                ref={(node) => {
                  articleRefs.current[index] = node;
                }}
                data-project-slug={project.slug}
                tabIndex={0}
                onFocus={() => setActiveSlug(project.slug)}
              >
                <div className="project-card-mobile-image">
                  <Image
                    src={project.image}
                    alt={`Imagem do projeto ${project.title}`}
                    fill
                    sizes="(max-width: 760px) 100vw, 40vw"
                  />
                  <span>{project.collection}</span>
                </div>
                <div className="project-focus-card-heading">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <small>{project.category}</small>
                    <h2>{project.title}</h2>
                  </div>
                </div>
                <p className="project-focus-summary">{project.summary}</p>
                <dl>
                  <div>
                    <dt>Eu paguei</dt>
                    <dd>{money(project.pricePaid)}</dd>
                  </div>
                  <div>
                    <dt>O problema</dt>
                    <dd>{project.problem}</dd>
                  </div>
                  {project.repair && (
                    <div>
                      <dt>O reparo</dt>
                      <dd>{project.repair}</dd>
                    </div>
                  )}
                  <div>
                    <dt>O resultado</dt>
                    <dd>{project.result}</dd>
                  </div>
                </dl>
                {project.learning && (
                  <div className="project-learning">
                    <strong>O que ficou comigo</strong>
                    <p>{project.learning}</p>
                  </div>
                )}
                <div className="project-card-footer">
                  <span>{project.currentStatus}</span>
                  <a href={project.youtubeUrl} target="_blank" rel="noreferrer">
                    Assistir no YouTube ↗
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-state" role="status">
          <strong>Nenhum projeto neste filtro.</strong>
        </div>
      )}
    </section>
  );
}
