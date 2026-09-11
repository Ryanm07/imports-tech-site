"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { stepRoadSpring, type RoadSpring } from "@/lib/journey-road";

export function JourneyRoad({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const element = root.current;
    const drawing = svg.current;
    if (!element || !drawing) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    let points: { x: number; y: number; spring: RoadSpring }[] = [];
    let frame = 0;
    let previous = 0;
    let pointer = { x: -1000, y: -1000, speed: 0, direction: 1, time: 0 };
    const paint = () => {
      const d = points
        .map(
          (point, index) =>
            `${index ? "L" : "M"}${(point.x + point.spring.offset).toFixed(2)},${point.y.toFixed(2)}`,
        )
        .join(" ");
      drawing
        .querySelectorAll("path")
        .forEach((path) => path.setAttribute("d", d));
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      pointer = { x: -1000, y: -1000, speed: 0, direction: 1, time: 0 };
      const width = element.clientWidth;
      const height = element.clientHeight;
      const mobile = matchMedia("(max-width: 700px)").matches;
      const stops = [
        ...element.querySelectorAll<HTMLElement>("[data-journey-stop]"),
      ].map((stop) => stop.offsetTop + 64);
      const anchors = [0, ...stops, height];
      drawing.setAttribute("viewBox", `0 0 ${width} ${height}`);
      const count = Math.ceil(height / 12) + 1;
      points = Array.from({ length: count }, (_, index) => {
        const y = (index / (count - 1)) * height;
        const segment = Math.max(
          0,
          anchors.findIndex(
            (value, i) =>
              i < anchors.length - 1 && y >= value && y <= anchors[i + 1],
          ),
        );
        const t =
          (y - anchors[segment]) /
          Math.max(1, anchors[segment + 1] - anchors[segment]);
        const bend = Math.sin(t * Math.PI) ** 2 * (segment % 2 ? -1 : 1);
        return {
          x: mobile ? 29 + bend * 9 : width / 2 + bend * width * 0.072,
          y,
          spring: { offset: 0, velocity: 0 },
        };
      });
      paint();
    };
    const animate = (time: number) => {
      const dt = previous ? (time - previous) / 1000 : 1 / 60;
      previous = time;
      let moving = false;
      for (const point of points) {
        const distance = Math.hypot(
          point.x + point.spring.offset - pointer.x,
          (point.y - pointer.y) * 0.65,
        );
        const proximity = Math.max(0, 1 - distance / 145);
        const freshness = Math.max(0, 1 - (time - pointer.time) / 450);
        const ripple = Math.sin((point.y - pointer.y) / 38 + time / 100);
        const force =
          proximity *
          freshness *
          (pointer.direction * 350 + ripple * Math.min(pointer.speed, 3) * 650);
        point.spring = stepRoadSpring(point.spring, force, dt);
        moving ||=
          Math.abs(point.spring.offset) > 0.04 ||
          Math.abs(point.spring.velocity) > 0.04 ||
          Math.abs(force) > 0.1;
      }
      paint();
      if (moving) frame = requestAnimationFrame(animate);
      else {
        points.forEach((point) => {
          point.spring = { offset: 0, velocity: 0 };
        });
        paint();
        frame = 0;
        previous = 0;
      }
    };
    const move = (event: PointerEvent) => {
      if (
        event.pointerType === "touch" ||
        reduced.matches ||
        !fine.matches ||
        matchMedia("(max-width: 700px)").matches
      )
        return;
      const bounds = element.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const time = performance.now();
      const elapsed = time - pointer.time;
      const speed =
        elapsed > 0 && elapsed < 150
          ? Math.hypot(x - pointer.x, y - pointer.y) / elapsed
          : 0;
      pointer = { x, y, speed, direction: x >= pointer.x ? 1 : -1, time };
      if (!frame) frame = requestAnimationFrame(animate);
    };
    const leave = () => {
      pointer.time = -1000;
    };
    const visibility = () => {
      if (document.hidden) reset();
    };
    const observer = new ResizeObserver(reset);
    observer.observe(element);
    element.addEventListener("pointermove", move, { passive: true });
    element.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", visibility);
    reduced.addEventListener("change", reset);
    reset();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", visibility);
      reduced.removeEventListener("change", reset);
    };
  }, []);
  return (
    <div className="journey-map" ref={root}>
      <svg
        ref={svg}
        className="journey-road"
        aria-hidden="true"
        viewBox="0 0 1000 2800"
        preserveAspectRatio="none"
      >
        <path className="journey-road-shadow" d="M500 0V2800" />
        <path className="journey-road-edge" d="M500 0V2800" />
        <path className="journey-road-surface" d="M500 0V2800" />
        <path className="journey-road-center" d="M500 0V2800" />
      </svg>
      {children}
    </div>
  );
}

export function JourneyEmblem({ index }: { index: number }) {
  const drawings = [
    <g key="keyboard">
      <rect x="9" y="24" width="62" height="34" rx="5" />
      <path d="M18 34h4m7 0h4m7 0h4m7 0h4m7 0h2M18 43h4m7 0h4m7 0h4m7 0h13M24 51h29M51 24v-9h14" />
    </g>,
    <g key="light">
      <circle cx="40" cy="27" r="17" />
      <circle cx="40" cy="27" r="10" />
      <path d="M40 44v16m0-3L24 73m16-16 16 16M12 14l-5-4m61 4 5-4" />
    </g>,
    <g key="phone">
      <rect x="23" y="7" width="35" height="66" rx="7" />
      <path d="M33 13h15M36 66h9M37 28l-7 12 14-2-5 14 13-20-15 2" />
    </g>,
    <g key="camera">
      <rect x="9" y="22" width="62" height="43" rx="7" />
      <path d="m22 22 6-10h24l6 10M17 31h6" />
      <circle cx="42" cy="43" r="14" />
      <circle cx="42" cy="43" r="7" />
    </g>,
    <g key="laptop">
      <rect x="15" y="13" width="50" height="38" rx="4" />
      <path d="M15 51 6 65h68L65 51M32 59h16M33 27l-7 6 7 6m14-12 7 6-7 6" />
    </g>,
    <g key="community">
      <circle cx="40" cy="25" r="10" />
      <circle cx="16" cy="33" r="7" />
      <circle cx="64" cy="33" r="7" />
      <path d="M23 64v-9a17 17 0 0 1 34 0v9M5 63V52a11 11 0 0 1 14-11m56 22V52a11 11 0 0 0-14-11" />
    </g>,
    <g key="edit">
      <rect x="8" y="13" width="64" height="51" rx="5" />
      <path d="M8 48h64M21 56h12m6 0h20M34 24l16 9-16 9ZM28 71h24M40 64v7" />
    </g>,
  ];
  return (
    <svg
      className="journey-emblem"
      viewBox="0 0 80 80"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {drawings[index]}
    </svg>
  );
}
