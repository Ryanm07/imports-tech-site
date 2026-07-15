"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  chooseMotionMode,
  motionPhases,
  pageProgress,
  sectionProgress,
  type MotionMode,
} from "@/lib/motion";

type MotionContextValue = {
  mode: MotionMode;
  activeSection: string;
  direction: "up" | "down";
  paused: boolean;
};

const MotionContext = createContext<MotionContextValue>({
  mode: "light",
  activeSection: "top",
  direction: "down",
  paused: false,
});

export function useMotionExperience() {
  return useContext(MotionContext);
}

export function ScrollProgressProvider({ children }: { children: ReactNode }) {
  return <MotionProvider>{children}</MotionProvider>;
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<MotionMode>("light");
  const [activeSection, setActiveSection] = useState("top");
  const [direction, setDirection] = useState<"up" | "down">("down");
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (
      new URLSearchParams(window.location.search).get("motion") !== "measure"
    ) {
      return;
    }
    const root = document.documentElement;
    let frames = 0;
    let raf = 0;
    const started = performance.now();
    let cls = 0;
    let longTasks = 0;
    const observers: PerformanceObserver[] = [];
    const observe = (
      type: string,
      callback: (entry: PerformanceEntry) => void,
    ) => {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach(callback);
        });
        observer.observe({ type, buffered: true });
        observers.push(observer);
      } catch {
        // Older browsers simply expose the other measurements.
      }
    };
    observe("longtask", () => {
      longTasks += 1;
    });
    observe("layout-shift", (entry) => {
      const shift = entry as PerformanceEntry & {
        value?: number;
        hadRecentInput?: boolean;
      };
      if (!shift.hadRecentInput) cls += shift.value || 0;
    });
    const sample = (now: number) => {
      frames += 1;
      const elapsed = now - started;
      if (elapsed >= 1_000) {
        root.dataset.qaFps = Math.round((frames * 1_000) / elapsed).toString();
        root.dataset.qaLongTasks = longTasks.toString();
        root.dataset.qaCls = cls.toFixed(4);
      }
      raf = window.requestAnimationFrame(sample);
    };
    raf = window.requestAnimationFrame(sample);
    return () => {
      window.cancelAnimationFrame(raf);
      observers.forEach((observer) => observer.disconnect());
      delete root.dataset.qaFps;
      delete root.dataset.qaLongTasks;
      delete root.dataset.qaCls;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
        deviceMemory?: number;
      }
    ).connection;
    const getMode = () => {
      const forcedMode = new URLSearchParams(window.location.search).get(
        "motion",
      );
      if (forcedMode === "reduced" || forcedMode === "light") {
        return forcedMode;
      }
      return chooseMotionMode({
        reducedMotion: reducedQuery.matches,
        saveData: connection?.saveData,
        effectiveType: connection?.effectiveType,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: (navigator as Navigator & { deviceMemory?: number })
          .deviceMemory,
        viewportWidth: window.innerWidth,
      });
    };

    let currentMode = getMode();
    let lastY = window.scrollY;
    let lastTime = performance.now();
    let raf = 0;
    let dirty = true;
    let currentDirection: "up" | "down" = "down";
    let currentSection = "top";
    let pointerX = 0.5;
    let pointerY = 0.5;
    let measures: Array<{
      element: HTMLElement;
      top: number;
      height: number;
    }> = [];

    const measureSections = () => {
      const y = window.scrollY;
      measures = Array.from(
        document.querySelectorAll<HTMLElement>("[data-motion-section]"),
      ).map((element) => {
        const rect = element.getBoundingClientRect();
        return { element, top: rect.top + y, height: rect.height };
      });
      dirty = true;
    };

    const syncMode = () => {
      currentMode = getMode();
      root.dataset.motion = currentMode;
      setMode(currentMode);
      dirty = true;
    };

    const onScroll = () => {
      dirty = true;
    };
    const onResize = () => {
      syncMode();
      measureSections();
      dirty = true;
    };
    const onPointer = (event: PointerEvent) => {
      if (currentMode === "reduced") return;
      pointerX = event.clientX / Math.max(1, window.innerWidth);
      pointerY = event.clientY / Math.max(1, window.innerHeight);
      root.style.setProperty("--pointer-x", pointerX.toFixed(4));
      root.style.setProperty("--pointer-y", pointerY.toFixed(4));
    };
    const onVisibility = () => {
      const isPaused = document.hidden;
      setPaused(isPaused);
      root.toggleAttribute("data-motion-paused", isPaused);
      dirty = !isPaused;
    };
    const onIntroComplete = () => {
      root.dataset.introFlow = "complete";
      root.style.setProperty("--intro-momentum", "1");
      window.setTimeout(
        () => root.style.setProperty("--intro-momentum", "0"),
        currentMode === "reduced" ? 0 : 1400,
      );
    };

    const frame = (now: number) => {
      if (!document.hidden && dirty) {
        const y = window.scrollY;
        const elapsed = Math.max(16, now - lastTime);
        const delta = y - lastY;
        const nextDirection =
          delta < -1 ? "up" : delta > 1 ? "down" : currentDirection;
        const velocity = Math.min(1, Math.abs(delta) / elapsed / 1.4);
        const progress = pageProgress(
          y,
          document.documentElement.scrollHeight,
          window.innerHeight,
        );
        root.style.setProperty("--page-progress", progress.toFixed(4));
        root.style.setProperty("--scroll-velocity", velocity.toFixed(4));
        root.style.setProperty(
          "--scroll-direction",
          nextDirection === "down" ? "1" : "-1",
        );
        root.dataset.scrollDirection = nextDirection;

        let bestId = "top";
        let bestDistance = Number.POSITIVE_INFINITY;
        for (const measure of measures) {
          const section = measure.element;
          const top = measure.top - y;
          const bottom = top + measure.height;
          const local = sectionProgress(
            top,
            measure.height,
            window.innerHeight,
          );
          const phases = motionPhases(local);
          section.style.setProperty("--section-progress", local.toFixed(4));
          section.style.setProperty(
            "--section-approach",
            phases.approach.toFixed(4),
          );
          section.style.setProperty("--section-enter", phases.enter.toFixed(4));
          section.style.setProperty(
            "--section-center",
            phases.center.toFixed(4),
          );
          section.style.setProperty("--section-focus", phases.focus.toFixed(4));
          section.style.setProperty(
            "--section-transform",
            phases.transform.toFixed(4),
          );
          section.style.setProperty("--section-exit", phases.exit.toFixed(4));
          section.style.setProperty(
            "--section-direction",
            nextDirection === "down" ? "1" : "-1",
          );
          const distance = Math.abs(
            top +
              Math.min(measure.height, window.innerHeight) / 2 -
              window.innerHeight / 2,
          );
          if (
            bottom > 0 &&
            top < window.innerHeight &&
            distance < bestDistance
          ) {
            bestId = section.dataset.motionSection || section.id || "top";
            bestDistance = distance;
          }
        }
        if (bestId !== currentSection) {
          currentSection = bestId;
          root.dataset.activeSection = bestId;
          setActiveSection(bestId);
        }
        if (nextDirection !== currentDirection) {
          currentDirection = nextDirection;
          setDirection(nextDirection);
        }
        lastY = y;
        lastTime = now;
        dirty = false;
        window.dispatchEvent(
          new CustomEvent("imports-tech:motion-frame", {
            detail: {
              progress,
              velocity,
              direction: currentDirection,
              section: currentSection,
            },
          }),
        );
      }
      raf = window.requestAnimationFrame(frame);
    };

    syncMode();
    measureSections();
    root.classList.add("motion-ready");
    root.style.setProperty("--pointer-x", pointerX.toString());
    root.style.setProperty("--pointer-y", pointerY.toString());
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("imports-tech:intro-complete", onIntroComplete);
    document.addEventListener("visibilitychange", onVisibility);
    reducedQuery.addEventListener("change", syncMode);
    const resizeObserver = new ResizeObserver(measureSections);
    resizeObserver.observe(document.body);
    if (document.fonts) void document.fonts.ready.then(measureSections);
    raf = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener(
        "imports-tech:intro-complete",
        onIntroComplete,
      );
      document.removeEventListener("visibilitychange", onVisibility);
      reducedQuery.removeEventListener("change", syncMode);
      resizeObserver.disconnect();
      root.classList.remove("motion-ready");
    };
  }, []);

  const value = useMemo(
    () => ({ mode, activeSection, direction, paused }),
    [activeSection, direction, mode, paused],
  );
  return (
    <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
  );
}
