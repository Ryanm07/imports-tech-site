"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useMotionExperience } from "@/components/motion/motion-provider";
import type { TimelineItem } from "@/lib/content-repository";

export function StoryExperience({ timeline }: { timeline: TimelineItem[] }) {
  const { mode } = useMotionExperience();
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const active = timeline[activeIndex] || timeline[0];

  useEffect(() => {
    const elements = itemRefs.current.filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const next = Number((visible.target as HTMLElement).dataset.storyIndex);
        if (Number.isFinite(next)) setActiveIndex(next);
      },
      { rootMargin: "-28% 0px -32%", threshold: [0.05, 0.35, 0.65] },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [timeline]);

  function goTo(index: number) {
    itemRefs.current[index]?.scrollIntoView({
      behavior: mode === "reduced" ? "auto" : "smooth",
      block: "center",
    });
    setActiveIndex(index);
  }

  if (!active) return null;
  return (
    <section
      className="story-experience"
      data-motion-section="historia"
      aria-label="Minha trajetória"
    >
      <span className="section-signal-thread" aria-hidden="true" />
      <div className="story-timeline-heading">
        <span className="eyebrow-v2">MINHA TRAJETÓRIA</span>
        <h2>
          As viradas que mudaram o canal — e mudaram a minha forma de criar.
        </h2>
      </div>
      <div className="story-experience-layout">
        <aside className="story-rail" aria-label="Navegar pelos capítulos">
          <div className="story-rail-status" aria-live="polite">
            <span>CAPÍTULO</span>
            <strong>
              {String(activeIndex + 1).padStart(2, "0")} /{" "}
              {String(timeline.length).padStart(2, "0")}
            </strong>
            <small>{active.dateLabel}</small>
          </div>
          <div className="story-progress-track" aria-hidden="true">
            <i
              style={{
                transform: `scaleY(${(activeIndex + 1) / timeline.length})`,
              }}
            />
          </div>
          <div className="story-chapter-nav">
            {timeline.map((item, index) => (
              <button
                key={item.slug}
                type="button"
                className={index === activeIndex ? "is-active" : undefined}
                aria-label={`Ir para o capítulo ${index + 1}: ${item.title}`}
                aria-current={index === activeIndex ? "step" : undefined}
                onClick={() => goTo(index)}
              >
                {String(index + 1).padStart(2, "0")}
              </button>
            ))}
          </div>
        </aside>

        <ol className="story-chapters">
          {timeline.map((item, index) => (
            <li key={item.slug}>
              <article
                id={item.slug}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                data-story-index={index}
                className={
                  index === activeIndex
                    ? "story-chapter is-active"
                    : "story-chapter"
                }
                tabIndex={0}
                onFocus={() => setActiveIndex(index)}
              >
                <div className="story-chapter-signal" aria-hidden="true">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <i />
                  <i />
                </div>
                <div className="story-chapter-copy">
                  <div className="story-chapter-meta">
                    <span>{item.dateLabel}</span>
                    <small>
                      {item.datePrecision === "approximate"
                        ? "Data aproximada"
                        : "Data confirmada"}
                    </small>
                  </div>
                  {item.number && (
                    <strong className="story-chapter-number">
                      {item.number}
                    </strong>
                  )}
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <div className="story-entry-links">
                    {item.relatedProject && (
                      <Link href={`/projetos#${item.relatedProject}`}>
                        Ver projeto relacionado →
                      </Link>
                    )}
                    {item.youtubeUrl && (
                      <a
                        href={item.youtubeUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Assistir no YouTube ↗
                      </a>
                    )}
                  </div>
                </div>
                {item.imageUrl && (
                  <div className="story-entry-image">
                    <Image
                      src={item.imageUrl}
                      alt=""
                      fill
                      sizes="(max-width: 760px) 100vw, 24vw"
                    />
                  </div>
                )}
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
