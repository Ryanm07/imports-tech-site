"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useMotionExperience } from "@/components/motion/motion-provider";
import { StoryMicroScene } from "@/components/story-micro-scene";
import type { TimelineItem } from "@/lib/content-repository";
import { chapterPhases, clamp01, sectionProgress } from "@/lib/motion";
import { storyVisualTypeForSlug } from "@/lib/story";

type ChapterStyle = CSSProperties & {
  "--chapter-enter": number;
  "--chapter-focus": number;
  "--chapter-exit": number;
  "--chapter-signed": number;
};

export function StoryExperience({
  timeline,
  projectsEnabled = false,
}: {
  timeline: TimelineItem[];
  projectsEnabled?: boolean;
}) {
  const { mode } = useMotionExperience();
  const [activeIndex, setActiveIndex] = useState(0);
  const documentaryRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const activeIndexRef = useRef(0);
  const active = timeline[activeIndex] || timeline[0];

  const goTo = useCallback(
    (index: number) => {
      const documentary = documentaryRef.current;
      if (!documentary) return;
      const mobile = window.matchMedia("(max-width: 760px)").matches;
      if (mobile || mode === "reduced") {
        itemRefs.current[index]?.scrollIntoView({
          behavior: mode === "reduced" ? "auto" : "smooth",
          block: "center",
        });
      } else {
        const top = documentary.getBoundingClientRect().top + window.scrollY;
        const travel = Math.max(
          1,
          documentary.offsetHeight - window.innerHeight,
        );
        window.scrollTo({
          top: top + (index / Math.max(1, timeline.length - 1)) * travel,
          behavior: "smooth",
        });
      }
      activeIndexRef.current = index;
      setActiveIndex(index);
      history.replaceState(null, "", `#${timeline[index]?.slug || ""}`);
    },
    [mode, timeline],
  );

  useEffect(() => {
    const documentary = documentaryRef.current;
    if (!documentary || !timeline.length) return;
    let raf = 0;
    let top = 0;
    let travel = 1;
    let mobile = false;

    const measure = () => {
      mobile = window.matchMedia("(max-width: 760px)").matches;
      const rect = documentary.getBoundingClientRect();
      top = rect.top + window.scrollY;
      travel = Math.max(1, documentary.offsetHeight - window.innerHeight);
      update();
    };
    const setActive = (next: number) => {
      const safe = Math.max(0, Math.min(timeline.length - 1, next));
      if (safe === activeIndexRef.current) return;
      activeIndexRef.current = safe;
      setActiveIndex(safe);
    };
    const paintChapter = (index: number, position: number) => {
      const element = itemRefs.current[index];
      if (!element) return;
      const phases = chapterPhases(position, index);
      element.style.setProperty("--chapter-enter", phases.enter.toFixed(4));
      element.style.setProperty("--chapter-focus", phases.focus.toFixed(4));
      element.style.setProperty("--chapter-exit", phases.exit.toFixed(4));
      element.style.setProperty("--chapter-signed", phases.signed.toFixed(4));
    };
    const update = () => {
      raf = 0;
      if (mode === "reduced") return;
      if (mobile) {
        let closest = 0;
        let distance = Number.POSITIVE_INFINITY;
        itemRefs.current.forEach((element, index) => {
          if (!element) return;
          const rect = element.getBoundingClientRect();
          const local = sectionProgress(
            rect.top,
            rect.height,
            window.innerHeight,
          );
          const position = clamp01((local - 0.16) / 0.68);
          const focus = 1 - Math.min(1, Math.abs(position - 0.52) * 1.9);
          element.style.setProperty("--chapter-enter", position.toFixed(4));
          element.style.setProperty("--chapter-focus", focus.toFixed(4));
          element.style.setProperty(
            "--chapter-exit",
            clamp01((position - 0.72) / 0.28).toFixed(4),
          );
          element.style.setProperty(
            "--chapter-signed",
            (position - 0.5).toFixed(4),
          );
          const nextDistance = Math.abs(
            rect.top + rect.height * 0.48 - window.innerHeight * 0.5,
          );
          if (nextDistance < distance) {
            distance = nextDistance;
            closest = index;
          }
        });
        setActive(closest);
      } else {
        const progress = clamp01((window.scrollY - top) / travel);
        const position = progress * Math.max(0, timeline.length - 1);
        timeline.forEach((_, index) => paintChapter(index, position));
        setActive(Math.round(position));
        documentary.style.setProperty("--story-progress", progress.toFixed(4));
      }
      const current = timeline[activeIndexRef.current];
      if (current) {
        document.documentElement.dataset.storyVisual =
          current.visualType || storyVisualTypeForSlug(current.slug);
        document.documentElement.dataset.storyChapter = current.slug;
      }
    };
    const requestUpdate = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    measure();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", measure);
    const observer = new ResizeObserver(measure);
    observer.observe(documentary);

    const hash = decodeURIComponent(window.location.hash.slice(1));
    const hashIndex = timeline.findIndex((item) => item.slug === hash);
    if (hashIndex >= 0) requestAnimationFrame(() => goTo(hashIndex));

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", measure);
      delete document.documentElement.dataset.storyVisual;
      delete document.documentElement.dataset.storyChapter;
    };
  }, [goTo, mode, timeline]);

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
        <p>
          Role para avançar. Cada capítulo reage ao caminho, e você pode voltar
          quando quiser.
        </p>
      </div>

      <div
        className="story-documentary"
        ref={documentaryRef}
        style={{ "--chapter-count": timeline.length } as CSSProperties}
      >
        <div className="story-documentary-sticky">
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
              <i />
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

          <ol className="story-stage">
            {timeline.map((item, index) => {
              const initial = chapterPhases(0, index);
              return (
                <li key={item.slug}>
                  <article
                    id={item.slug}
                    ref={(node) => {
                      itemRefs.current[index] = node;
                    }}
                    data-story-index={index}
                    data-story-visual={
                      item.visualType || storyVisualTypeForSlug(item.slug)
                    }
                    className={
                      index === activeIndex
                        ? "story-chapter is-active"
                        : "story-chapter"
                    }
                    style={
                      {
                        "--chapter-enter": initial.enter,
                        "--chapter-focus": initial.focus,
                        "--chapter-exit": initial.exit,
                        "--chapter-signed": initial.signed,
                      } as ChapterStyle
                    }
                    tabIndex={0}
                    onFocus={() => {
                      activeIndexRef.current = index;
                      setActiveIndex(index);
                    }}
                  >
                    <div className="story-chapter-scene">
                      <StoryMicroScene item={item} />
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
                        {projectsEnabled && item.relatedProject && (
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
                    {item.imageUrl && item.fallbackMode === "asset" && (
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
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
