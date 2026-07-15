"use client";

import { useEffect } from "react";
import { clamp01 } from "@/lib/motion";

export function HomeScrollDirector() {
  useEffect(() => {
    const update = () => {
      const sequences = document.querySelectorAll<HTMLElement>(
        "[data-scroll-sequence]",
      );
      sequences.forEach((sequence) => {
        const raw = Number.parseFloat(
          getComputedStyle(sequence).getPropertyValue("--section-progress"),
        );
        const progress = clamp01((raw - 0.18) / 0.64);
        const items = Array.from(
          sequence.querySelectorAll<HTMLElement>("[data-sequence-item]"),
        );
        const position = progress * Math.max(0, items.length - 1);
        let active = 0;
        let best = Number.POSITIVE_INFINITY;
        items.forEach((item, index) => {
          const signed = position - index;
          const distance = Math.abs(signed);
          const focus = clamp01(1 - distance);
          const enter = clamp01(signed + 1);
          const exit = clamp01(signed);
          item.style.setProperty("--item-distance", signed.toFixed(4));
          item.style.setProperty("--item-focus", focus.toFixed(4));
          item.style.setProperty("--item-enter", enter.toFixed(4));
          item.style.setProperty("--item-exit", exit.toFixed(4));
          if (distance < best) {
            best = distance;
            active = index;
          }
        });
        items.forEach((item, index) => {
          item.classList.toggle("is-sequence-active", index === active);
        });
        sequence.style.setProperty("--sequence-progress", progress.toFixed(4));
        sequence.dataset.sequenceActive = String(active);
      });
    };
    update();
    window.addEventListener("imports-tech:motion-frame", update);
    return () =>
      window.removeEventListener("imports-tech:motion-frame", update);
  }, []);
  return null;
}
