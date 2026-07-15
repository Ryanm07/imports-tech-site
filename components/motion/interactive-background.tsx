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
  const { mode, paused, activeSection } = useMotionExperience();

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
      const styles = getComputedStyle(document.documentElement);
      const progress =
        Number.parseFloat(styles.getPropertyValue("--page-progress")) || 0;
      const velocity =
        Number.parseFloat(styles.getPropertyValue("--scroll-velocity")) || 0;
      const pointerX =
        Number.parseFloat(styles.getPropertyValue("--pointer-x")) || 0.5;
      const pointerY =
        Number.parseFloat(styles.getPropertyValue("--pointer-y")) || 0.5;
      const t = time * 0.00012;
      const sectionEnergy =
        activeSection === "historia" || activeSection === "projetos" ? 1 : 0.74;

      context.clearRect(0, 0, width, height);
      const glow = context.createRadialGradient(
        width * (0.28 + pointerX * 0.08),
        height * (0.24 + pointerY * 0.08),
        0,
        width * 0.45,
        height * 0.4,
        Math.max(width, height) * 0.72,
      );
      glow.addColorStop(0, `rgba(246, 183, 19, ${0.035 * sectionEnergy})`);
      glow.addColorStop(0.46, "rgba(13, 58, 100, .045)");
      glow.addColorStop(1, "rgba(4, 13, 25, 0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      for (let lane = 0; lane < 3; lane += 1) {
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
            ((node.y + progress * (0.08 + lane * 0.018)) % 1) * height + driftY;
          if (index === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        context.strokeStyle = `rgba(97, 151, 202, ${0.045 + velocity * 0.035})`;
        context.lineWidth = 0.75;
        context.stroke();
      }

      for (const node of nodes) {
        const x =
          node.x * width +
          Math.sin(t * 3 + node.phase) * 8 +
          (pointerX - 0.5) * 10;
        const y =
          ((node.y + progress * (0.08 + node.lane * 0.018)) % 1) * height +
          Math.cos(t * 2 + node.phase) * 6;
        context.beginPath();
        context.arc(x, y, node.size + velocity * 0.8, 0, Math.PI * 2);
        context.fillStyle =
          node.size > 1
            ? "rgba(246, 183, 19, .36)"
            : "rgba(160, 199, 232, .24)";
        context.fill();
      }
      raf = window.requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      running = !document.hidden;
      if (running) raf = window.requestAnimationFrame(draw);
      else window.cancelAnimationFrame(raf);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    if (!paused) raf = window.requestAnimationFrame(draw);
    return () => {
      running = false;
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [activeSection, mode, paused]);

  return (
    <div className="interactive-background" aria-hidden="true">
      <canvas ref={canvasRef} />
      <span className="interactive-background-noise" />
      <span className="global-signal-thread" />
    </div>
  );
}
