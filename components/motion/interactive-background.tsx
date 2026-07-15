"use client";

import { useEffect, useRef } from "react";
import { useMotionExperience } from "@/components/motion/motion-provider";

type SignalNode = {
  x: number;
  y: number;
  phase: number;
  size: number;
  lane: number;
};

export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { mode, paused } = useMotionExperience();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || mode === "reduced") return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const nodeCount = mode === "full" ? 22 : 12;
    const nodes: SignalNode[] = Array.from(
      { length: nodeCount },
      (_, index) => ({
        x: ((index * 47) % 101) / 100,
        y: ((index * 29 + 13) % 97) / 100,
        phase: index * 0.71,
        size: index % 5 === 0 ? 1.8 : 1,
        lane: index % 3,
      }),
    );
    let width = 1;
    let height = 1;
    let dpr = 1;
    let raf = 0;
    let running = !paused;
    let narrativeEnergy = 0.72;
    let narrativeDensity = 0.72;
    let narrativeSpread = 0.5;
    let progress = 0;
    let velocity = 0;
    let pointerX = 0.5;
    let pointerY = 0.5;
    let direction = 1;
    let activeSection = "hero";
    let activeVisual = "";

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, mode === "full" ? 1.5 : 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time: number) => {
      if (!running) return;
      const t = time * 0.00012;
      const target = narrativeState(activeSection, activeVisual);
      narrativeEnergy += (target.energy - narrativeEnergy) * 0.035;
      narrativeDensity += (target.density - narrativeDensity) * 0.028;
      narrativeSpread += (target.spread - narrativeSpread) * 0.03;

      context.clearRect(0, 0, width, height);
      const glow = context.createRadialGradient(
        width * (0.24 + pointerX * 0.1 + narrativeSpread * 0.06),
        height * (0.2 + pointerY * 0.08),
        0,
        width * 0.45,
        height * 0.4,
        Math.max(width, height) * 0.72,
      );
      glow.addColorStop(
        0,
        `rgba(246, 183, 19, ${0.028 + 0.03 * narrativeEnergy})`,
      );
      glow.addColorStop(0.46, "rgba(13, 58, 100, .045)");
      glow.addColorStop(1, "rgba(4, 13, 25, 0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      for (let lane = 0; lane < (narrativeDensity > 0.86 ? 3 : 2); lane += 1) {
        const laneNodes = nodes.filter((node) => node.lane === lane);
        context.beginPath();
        laneNodes.forEach((node, index) => {
          const driftX =
            Math.sin(t * 3 + node.phase) * 8 +
            (pointerX - 0.5) * (9 + lane * 3);
          const driftY =
            Math.cos(t * 2 + node.phase) * 6 + (pointerY - 0.5) * 6;
          const x = node.x * width + driftX;
          const y =
            wrap01(node.y + progress * (0.07 + lane * 0.018) * direction) *
              height +
            driftY;
          if (index === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        context.strokeStyle = `rgba(97, 151, 202, ${0.025 + narrativeDensity * 0.035 + velocity * 0.04})`;
        context.lineWidth = 0.55 + narrativeDensity * 0.35;
        context.stroke();
      }

      for (const node of nodes) {
        const x =
          node.x * width +
          Math.sin(t * 3 + node.phase) * 8 +
          (pointerX - 0.5) * 10;
        const y =
          wrap01(node.y + progress * (0.07 + node.lane * 0.018) * direction) *
            height +
          Math.cos(t * 2 + node.phase) * 6;
        context.beginPath();
        context.arc(x, y, node.size + velocity * 0.8, 0, Math.PI * 2);
        context.globalAlpha = 0.5 + narrativeEnergy * 0.5;
        context.fillStyle =
          node.size > 1
            ? "rgba(246, 183, 19, .36)"
            : "rgba(160, 199, 232, .24)";
        context.fill();
        context.globalAlpha = 1;
      }
      raf = window.requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      running = !document.hidden;
      if (running) raf = window.requestAnimationFrame(draw);
      else window.cancelAnimationFrame(raf);
    };
    const onMotionFrame = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          progress?: number;
          velocity?: number;
          direction?: "up" | "down";
          section?: string;
        }>
      ).detail;
      progress = detail?.progress ?? progress;
      velocity = detail?.velocity ?? velocity;
      direction = detail?.direction === "up" ? -1 : 1;
      activeSection = detail?.section || activeSection;
      activeVisual = document.documentElement.dataset.storyVisual || "";
    };
    const onPointer = (event: PointerEvent) => {
      pointerX = event.clientX / Math.max(1, window.innerWidth);
      pointerY = event.clientY / Math.max(1, window.innerHeight);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("imports-tech:motion-frame", onMotionFrame);
    document.addEventListener("visibilitychange", onVisibility);
    if (!paused) raf = window.requestAnimationFrame(draw);
    return () => {
      running = false;
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("imports-tech:motion-frame", onMotionFrame);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [mode, paused]);

  return (
    <div className="interactive-background" aria-hidden="true">
      <canvas ref={canvasRef} />
      <span className="interactive-background-noise" />
      <span className="global-signal-thread" />
    </div>
  );
}

function wrap01(value: number) {
  return ((value % 1) + 1) % 1;
}

function narrativeState(section: string, visual: string) {
  if (section === "historia") {
    if (visual === "heavy-processing") {
      return { energy: 0.94, density: 1, spread: 0.34 };
    }
    if (visual === "massive-number" || visual === "mechanical-switch") {
      return { energy: 1, density: 0.9, spread: 0.62 };
    }
    if (visual === "future-target") {
      return { energy: 0.7, density: 0.42, spread: 1 };
    }
    return { energy: 0.82, density: 0.76, spread: 0.56 };
  }
  const states: Record<
    string,
    { energy: number; density: number; spread: number }
  > = {
    hero: { energy: 0.92, density: 0.82, spread: 0.64 },
    metricas: { energy: 0.78, density: 0.7, spread: 0.52 },
    apresentacao: { energy: 0.52, density: 0.48, spread: 0.42 },
    trajetoria: { energy: 0.88, density: 0.84, spread: 0.58 },
    comunidade: { energy: 0.72, density: 0.62, spread: 0.92 },
    empresas: { energy: 0.46, density: 0.34, spread: 0.5 },
    continuar: { energy: 0.7, density: 0.48, spread: 0.5 },
    meta: { energy: 0.66, density: 0.38, spread: 1 },
  };
  return states[section] || { energy: 0.65, density: 0.55, spread: 0.5 };
}
