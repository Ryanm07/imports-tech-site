"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const [mode, setMode] = useState<MotionMode>("light");
  const [activeSection, setActiveSection] = useState("top");
  const [direction, setDirection] = useState<"up" | "down">("down");
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerQuery = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    );
    const connection = (
      navigator as Navigator & {
        connection?: EventTarget & {
          saveData?: boolean;
          effectiveType?: string;
        };
        deviceMemory?: number;
      }
    ).connection;
    const getMode = (): MotionMode => {
      // A user's accessibility preference always takes priority over a QA override.
      if (reducedQuery.matches) return "reduced";
      const forced = new URLSearchParams(window.location.search).get("motion");
      if (forced === "reduced" || forced === "light") return forced;
      return chooseMotionMode({
        reducedMotion: false,
        saveData: connection?.saveData,
        effectiveType: connection?.effectiveType,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: (navigator as Navigator & { deviceMemory?: number })
          .deviceMemory,
        viewportWidth: window.innerWidth,
      });
    };

    let disposed = false;
    let currentMode = getMode();
    let lastY = window.scrollY;
    let lastTime = performance.now();
    let raf = 0;
    let needsMeasure = true;
    let needsScroll = true;
    let pointerX = 0.5;
    let pointerY = 0.5;
    let currentDirection: "up" | "down" = "down";
    let currentSection = "top";
    let momentumTimer = 0;
    let velocityTimer = 0;
    let measures: Array<{ element: HTMLElement; top: number; height: number }> =
      [];
    const pendingReveals = new Set<HTMLElement>();
    const registeredReveals = new WeakSet<HTMLElement>();

    const reveal = (element: HTMLElement) => {
      element.classList.remove("reveal-pending");
      element.classList.add("is-revealed");
      pendingReveals.delete(element);
      revealObserver?.unobserve(element);
    };
    const revealObserver =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) =>
              entries.forEach((entry) => {
                if (entry.isIntersecting) reveal(entry.target as HTMLElement);
              }),
            { rootMargin: "0px 0px -32px 0px", threshold: 0 },
          );

    const requestFrame = () => {
      if (!disposed && !document.hidden && !raf)
        raf = window.requestAnimationFrame(frame);
    };
    const invalidateMeasurements = () => {
      needsMeasure = true;
      needsScroll = true;
      requestFrame();
    };
    const syncMode = () => {
      currentMode = getMode();
      if (currentMode === "reduced" || !pointerQuery.matches) {
        pointerX = 0.5;
        pointerY = 0.5;
      }
      if (currentMode === "reduced") pendingReveals.forEach(reveal);
      root.dataset.motion = currentMode;
      setMode(currentMode);
      invalidateMeasurements();
    };
    const onScroll = () => {
      needsScroll = true;
      requestFrame();
    };
    const onPointer = (event: PointerEvent) => {
      if (
        currentMode === "reduced" ||
        !pointerQuery.matches ||
        event.pointerType === "touch"
      )
        return;
      pointerX = Math.max(
        0,
        Math.min(1, event.clientX / Math.max(1, window.innerWidth)),
      );
      pointerY = Math.max(
        0,
        Math.min(1, event.clientY / Math.max(1, window.innerHeight)),
      );
      requestFrame();
    };
    const onVisibility = () => {
      setPaused(document.hidden);
      root.toggleAttribute("data-motion-paused", document.hidden);
      if (document.hidden) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      } else {
        lastTime = performance.now();
        invalidateMeasurements();
      }
    };
    const onIntroComplete = () => {
      root.dataset.introFlow = "complete";
      root.style.setProperty(
        "--intro-momentum",
        currentMode === "reduced" ? "0" : "1",
      );
      window.clearTimeout(momentumTimer);
      momentumTimer = window.setTimeout(
        () => root.style.setProperty("--intro-momentum", "0"),
        1400,
      );
      invalidateMeasurements();
    };
    const onFocus = (event: FocusEvent) => {
      // Keyboard navigation must never land on a visually hidden reveal.
      if (!(event.target instanceof Element)) return;
      const element = event.target.closest<HTMLElement>("[data-reveal]");
      if (element) reveal(element);
    };

    function frame(now: number) {
      raf = 0;
      if (disposed || document.hidden) return;
      if (!needsMeasure && !needsScroll) {
        root.style.setProperty("--pointer-x", pointerX.toFixed(4));
        root.style.setProperty("--pointer-y", pointerY.toFixed(4));
        return;
      }
      const y = window.scrollY;
      const viewportHeight = window.innerHeight;
      const documentHeight = root.scrollHeight;
      const scrollChanged = needsScroll;
      const revealMeasurements: Array<{
        element: HTMLElement;
        visible: boolean;
      }> = [];

      // Collect every layout read before writing CSS variables or reveal classes.
      if (needsMeasure) {
        measures = Array.from(
          document.querySelectorAll<HTMLElement>("[data-motion-section]"),
        ).map((element) => {
          const rect = element.getBoundingClientRect();
          return { element, top: rect.top + y, height: rect.height };
        });
        document
          .querySelectorAll<HTMLElement>("[data-reveal]")
          .forEach((element) => {
            if (registeredReveals.has(element)) return;
            const rect = element.getBoundingClientRect();
            revealMeasurements.push({
              element,
              visible: rect.top < viewportHeight && rect.bottom >= 0,
            });
            registeredReveals.add(element);
          });
        needsMeasure = false;
      }
      needsScroll = false;
      const delta = y - lastY;
      const nextDirection =
        delta < -1 ? "up" : delta > 1 ? "down" : currentDirection;
      const velocity = Math.min(
        1,
        Math.abs(delta) / Math.max(16, now - lastTime) / 1.4,
      );
      const progress = pageProgress(y, documentHeight, viewportHeight);
      let bestId = "top";
      let bestDistance = Number.POSITIVE_INFINITY;
      const sectionValues = scrollChanged
        ? measures.map((measure) => {
            const top = measure.top - y;
            const local = sectionProgress(top, measure.height, viewportHeight);
            const distance = Math.abs(
              top +
                Math.min(measure.height, viewportHeight) / 2 -
                viewportHeight / 2,
            );
            if (
              top + measure.height > 0 &&
              top < viewportHeight &&
              distance < bestDistance
            ) {
              bestDistance = distance;
              bestId =
                measure.element.dataset.motionSection ||
                measure.element.id ||
                "top";
            }
            return {
              element: measure.element,
              local,
              phases: motionPhases(local),
            };
          })
        : [];

      root.style.setProperty("--pointer-x", pointerX.toFixed(4));
      root.style.setProperty("--pointer-y", pointerY.toFixed(4));
      revealMeasurements.forEach(({ element, visible }) => {
        if (
          visible ||
          currentMode === "reduced" ||
          !revealObserver ||
          element.classList.contains("is-revealed")
        )
          reveal(element);
        else {
          element.classList.add("reveal-pending");
          pendingReveals.add(element);
          revealObserver.observe(element);
        }
      });
      if (!scrollChanged) return;
      root.style.setProperty("--page-progress", progress.toFixed(4));
      root.style.setProperty("--scroll-velocity", velocity.toFixed(4));
      root.style.setProperty(
        "--scroll-direction",
        nextDirection === "down" ? "1" : "-1",
      );
      root.dataset.scrollDirection = nextDirection;
      sectionValues.forEach(({ element, local, phases }) => {
        element.style.setProperty("--section-progress", local.toFixed(4));
        Object.entries(phases).forEach(([name, value]) =>
          element.style.setProperty(`--section-${name}`, value.toFixed(4)),
        );
        element.style.setProperty(
          "--section-direction",
          nextDirection === "down" ? "1" : "-1",
        );
      });
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
      window.clearTimeout(velocityTimer);
      if (velocity)
        velocityTimer = window.setTimeout(
          () => root.style.setProperty("--scroll-velocity", "0"),
          120,
        );
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

    syncMode();
    root.classList.add("motion-ready");
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", syncMode, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("imports-tech:intro-complete", onIntroComplete);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("focusin", onFocus);
    reducedQuery.addEventListener("change", syncMode);
    pointerQuery.addEventListener("change", syncMode);
    connection?.addEventListener?.("change", syncMode);
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(invalidateMeasurements);
    resizeObserver?.observe(document.body);
    // Streamed route content can arrive after the pathname effect commits.
    const mutationObserver = new MutationObserver(invalidateMeasurements);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    if (document.fonts)
      void document.fonts.ready.then(() => {
        if (!disposed) invalidateMeasurements();
      });

    return () => {
      disposed = true;
      window.cancelAnimationFrame(raf);
      window.clearTimeout(momentumTimer);
      window.clearTimeout(velocityTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", syncMode);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener(
        "imports-tech:intro-complete",
        onIntroComplete,
      );
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("focusin", onFocus);
      reducedQuery.removeEventListener("change", syncMode);
      pointerQuery.removeEventListener("change", syncMode);
      connection?.removeEventListener?.("change", syncMode);
      resizeObserver?.disconnect();
      mutationObserver.disconnect();
      revealObserver?.disconnect();
      pendingReveals.forEach((element) =>
        element.classList.remove("reveal-pending"),
      );
      root.classList.remove("motion-ready");
    };
  }, [pathname]);

  const value = useMemo(
    () => ({ mode, activeSection, direction, paused }),
    [activeSection, direction, mode, paused],
  );
  return (
    <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
  );
}
